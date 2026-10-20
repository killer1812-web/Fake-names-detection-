import os
import io
import csv
import uuid
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.identity import Dataset, IdentityRecord, AnalysisResult, ReviewRecord
from app.services.cleaner import normalize_name, normalize_email, normalize_phone
from app.services.duplicate_detector import detect_duplicates_in_dataset
from app.services.rule_engine import evaluate_record_rules
from app.ml.model_manager import model_manager
from app.core.config import settings

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024 # 25 MB

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    name_col: Optional[str] = Form("full_name"),
    email_col: Optional[str] = Form("email"),
    phone_col: Optional[str] = Form("phone"),
    city_col: Optional[str] = Form("city"),
    date_col: Optional[str] = Form("date_created"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are supported.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum supported size is 25MB.")

    # Handle multiple encodings safely
    text_content = None
    for enc in ("utf-8-sig", "utf-8", "latin1", "cp1252"):
        try:
            text_content = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue

    if text_content is None:
        raise HTTPException(status_code=400, detail="Unable to decode file. Please ensure standard UTF-8 CSV encoding.")

    # Parse CSV
    reader = csv.DictReader(io.StringIO(text_content))
    fieldnames = reader.fieldnames or []

    # Detect name column if default doesn't match
    target_name_col = name_col if name_col in fieldnames else None
    if not target_name_col:
        for possible in ["full_name", "name", "fullname", "first_name", "customer_name", "person_name"]:
            if possible in fieldnames:
                target_name_col = possible
                break

    if not target_name_col:
        raise HTTPException(
            status_code=400,
            detail=f"Required identity name column not found in CSV. Available headers: {', '.join(fieldnames)}"
        )

    # Detect other columns flexibly
    target_email_col = email_col if email_col in fieldnames else next((c for c in ["email", "mail", "email_address"] if c in fieldnames), None)
    target_phone_col = phone_col if phone_col in fieldnames else next((c for c in ["phone", "phone_number", "mobile", "tel"] if c in fieldnames), None)
    target_city_col = city_col if city_col in fieldnames else next((c for c in ["city", "town", "location"] if c in fieldnames), None)
    target_date_col = date_col if date_col in fieldnames else next((c for c in ["date_created", "created_date", "date", "created_at"] if c in fieldnames), None)

    # Ingest rows
    raw_rows = []
    error_rows = []
    row_index = 0

    for row in reader:
        row_index += 1
        raw_name = row.get(target_name_col, "").strip() if target_name_col else ""
        if not raw_name:
            error_rows.append({"row": row_index, "error": "Empty or missing name field"})
            continue

        raw_rows.append({
            "record_id": f"REC-{uuid.uuid4().hex[:10].upper()}",
            "full_name": raw_name,
            "email": row.get(target_email_col, "").strip() if target_email_col else None,
            "phone": row.get(target_phone_col, "").strip() if target_phone_col else None,
            "city": row.get(target_city_col, "").strip() if target_city_col else None,
            "date_created": row.get(target_date_col, "").strip() if target_date_col else datetime.date.today().isoformat(),
            "synthetic_label": int(row["synthetic_label"]) if "synthetic_label" in row and row["synthetic_label"].isdigit() else None
        })

    if not raw_rows and error_rows:
        raise HTTPException(status_code=400, detail=f"No valid records found. {len(error_rows)} rows had missing names.")

    # Deduplication & cluster grouping
    enriched_rows = detect_duplicates_in_dataset(raw_rows)

    job_id = f"JOB-{uuid.uuid4().hex[:10].upper()}"
    ds_name = dataset_name or file.filename or f"Upload_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    dataset = Dataset(
        dataset_name=ds_name,
        source_type="CSV_UPLOAD",
        total_records=len(raw_rows) + len(error_rows),
        processed_records=len(enriched_rows),
        failed_records=len(error_rows),
        processing_status="COMPLETED"
    )
    db.add(dataset)
    db.flush()

    flagged_count = 0
    valid_count = 0
    duplicate_count = 0

    # Batch insert into DB
    for item in enriched_rows:
        f_name = item["full_name"]
        n_name = normalize_name(f_name)
        email = item["email"]
        n_email = normalize_email(email) if email else None
        phone = item["phone"]
        city = item["city"]
        is_dup = bool(item.get("is_duplicate", False))
        if is_dup:
            duplicate_count += 1

        val_status, signals, explanations, suggested_action = evaluate_record_rules(
            full_name=f_name,
            email=email,
            phone=phone,
            city=city,
            date_created=item["date_created"],
            duplicate_count=1 if is_dup else 0
        )

        if val_status in ("FLAGGED", "INVALID_FORMAT"):
            flagged_count += 1
        else:
            valid_count += 1

        # Model prediction
        model_res = model_manager.predict_record(
            full_name=f_name,
            email=email,
            phone=phone,
            city=city,
            is_duplicate=is_dup
        )

        rec = IdentityRecord(
            record_id=item["record_id"],
            full_name=f_name,
            normalized_name=n_name,
            email=email,
            normalized_email=n_email,
            phone=phone,
            city=city,
            date_created=item["date_created"],
            source_dataset_id=dataset.id,
            validation_status=val_status,
            is_duplicate=is_dup,
            duplicate_group_id=item.get("duplicate_group_id"),
            synthetic_label=item.get("synthetic_label")
        )
        db.add(rec)
        db.flush()

        analysis = AnalysisResult(
            record_id=rec.id,
            analysis_job_id=job_id,
            rule_signals=signals,
            model_version=model_res.get("model_version") if model_res else None,
            prediction=model_res.get("prediction") if model_res else ("REVIEW_RECOMMENDED" if val_status == "FLAGGED" else "NORMAL"),
            probability=model_res.get("probability") if model_res else None,
            anomaly_score=model_res.get("anomaly_score") if model_res else None,
            explanation={"reasons": explanations, "suggested_action": suggested_action}
        )
        db.add(analysis)

        if val_status in ("FLAGGED", "INVALID_FORMAT") or is_dup:
            rev = ReviewRecord(
                identity_record_id=rec.id,
                review_status="PENDING",
                reviewer_notes=f"Auto-queued from CSV upload '{ds_name}': {suggested_action}"
            )
            db.add(rev)

    db.commit()

    return {
        "job_id": job_id,
        "dataset_id": dataset.id,
        "dataset_name": ds_name,
        "total_rows": len(raw_rows) + len(error_rows),
        "processed_rows": len(enriched_rows),
        "failed_rows": len(error_rows),
        "flagged_rows": flagged_count,
        "valid_rows": valid_count,
        "duplicate_rows": duplicate_count,
        "detected_columns": {
            "name": target_name_col,
            "email": target_email_col,
            "phone": target_phone_col,
            "city": target_city_col,
            "date": target_date_col
        },
        "error_details": error_rows[:50],
        "message": f"Successfully analyzed and ingested {len(enriched_rows)} records."
    }

@router.get("/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    record_count = db.query(AnalysisResult).filter(AnalysisResult.analysis_job_id == job_id).count()
    if record_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    flagged = db.query(AnalysisResult).filter(
        AnalysisResult.analysis_job_id == job_id,
        AnalysisResult.prediction == "REVIEW_RECOMMENDED"
    ).count()

    return {
        "job_id": job_id,
        "status": "COMPLETED",
        "records_processed": record_count,
        "flagged_records": flagged,
        "completed_at": datetime.datetime.utcnow().isoformat()
    }
