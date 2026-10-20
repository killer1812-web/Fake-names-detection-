import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.db.session import get_db
from app.models.identity import IdentityRecord, AnalysisResult, ReviewRecord
from app.schemas.identity import (
    IdentityRecordResponse,
    PaginatedRecordsResponse,
    RecordCreate,
    RecordUpdate,
    SingleRecordAnalysisRequest,
    SingleRecordAnalysisResult,
    AnalysisResultResponse,
    ReviewResponse,
    RuleSignal
)
from app.services.cleaner import normalize_name, normalize_email, normalize_phone
from app.services.duplicate_detector import find_duplicate_matches_in_db
from app.services.rule_engine import evaluate_record_rules
from app.ml.model_manager import model_manager
from app.core.config import settings

router = APIRouter()

@router.get("", response_model=PaginatedRecordsResponse)
def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    validation_status: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    is_duplicate: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    db: Session = Depends(get_db)
):
    query = db.query(IdentityRecord)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                IdentityRecord.record_id.ilike(search_term),
                IdentityRecord.full_name.ilike(search_term),
                IdentityRecord.email.ilike(search_term)
            )
        )

    # Validation status filter
    if validation_status:
        query = query.filter(IdentityRecord.validation_status == validation_status)

    # Duplicate filter
    if is_duplicate is not None:
        query = query.filter(IdentityRecord.is_duplicate == is_duplicate)

    # Review status filter
    if review_status:
        query = query.join(ReviewRecord).filter(ReviewRecord.review_status == review_status)

    total = query.count()

    # Sorting
    sort_column = getattr(IdentityRecord, sort_by, IdentityRecord.created_at)
    if sort_desc:
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Pagination
    records = query.offset((page - 1) * page_size).limit(page_size).all()

    # Format response
    items = []
    for r in records:
        latest_analysis = None
        if r.analysis_results:
            la = r.analysis_results[-1]
            latest_analysis = AnalysisResultResponse(
                id=la.id,
                record_id=la.record_id,
                analysis_job_id=la.analysis_job_id,
                rule_signals=[RuleSignal(**s) for s in (la.rule_signals or [])],
                model_version=la.model_version,
                prediction=la.prediction,
                probability=la.probability,
                anomaly_score=la.anomaly_score,
                explanation=la.explanation or {},
                analyzed_at=la.analyzed_at
            )

        latest_review = None
        if r.reviews:
            lr = r.reviews[-1]
            latest_review = ReviewResponse(
                id=lr.id,
                identity_record_id=lr.identity_record_id,
                review_status=lr.review_status,
                reviewer_notes=lr.reviewer_notes,
                reviewed_at=lr.reviewed_at,
                created_at=lr.created_at
            )

        items.append(
            IdentityRecordResponse(
                id=r.id,
                record_id=r.record_id,
                full_name=r.full_name,
                normalized_name=r.normalized_name,
                email=r.email,
                normalized_email=r.normalized_email,
                phone=r.phone,
                city=r.city,
                date_created=r.date_created,
                created_at=r.created_at,
                updated_at=r.updated_at,
                source_dataset_id=r.source_dataset_id,
                validation_status=r.validation_status,
                is_duplicate=r.is_duplicate,
                duplicate_group_id=r.duplicate_group_id,
                synthetic_label=r.synthetic_label,
                latest_analysis=latest_analysis,
                latest_review=latest_review
            )
        )

    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedRecordsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/analyze-single", response_model=SingleRecordAnalysisResult)
def analyze_single_record(
    payload: SingleRecordAnalysisRequest,
    db: Session = Depends(get_db)
):
    f_name = payload.full_name.strip()
    n_name = normalize_name(f_name)
    n_email = normalize_email(payload.email) if payload.email else None
    n_phone = normalize_phone(payload.phone) if payload.phone else None

    # Check for duplicate matches in database
    duplicate_matches = find_duplicate_matches_in_db(
        db=db,
        norm_name=n_name,
        norm_email=n_email,
        norm_phone=n_phone
    )

    # Evaluate deterministic rule signals
    val_status, signals, explanations, suggested_action = evaluate_record_rules(
        full_name=f_name,
        email=payload.email,
        phone=payload.phone,
        city=payload.city,
        date_created=payload.date_created,
        duplicate_count=len(duplicate_matches)
    )

    # Run ML model if trained
    model_output = model_manager.predict_record(
        full_name=f_name,
        email=payload.email,
        phone=payload.phone,
        city=payload.city,
        is_duplicate=(len(duplicate_matches) > 0)
    )

    record_id_created = None
    if payload.save_to_database:
        rec_id = f"REC-{uuid.uuid4().hex[:10].upper()}"
        is_dup = len(duplicate_matches) > 0
        new_record = IdentityRecord(
            record_id=rec_id,
            full_name=f_name,
            normalized_name=n_name,
            email=payload.email,
            normalized_email=n_email,
            phone=payload.phone,
            city=payload.city,
            date_created=payload.date_created or datetime.date.today().isoformat(),
            validation_status=val_status,
            is_duplicate=is_dup,
            duplicate_group_id=f"GRP-{uuid.uuid4().hex[:8].upper()}" if is_dup else None
        )
        db.add(new_record)
        db.flush()

        analysis_rec = AnalysisResult(
            record_id=new_record.id,
            analysis_job_id=f"SINGLE-ANALYSIS-{uuid.uuid4().hex[:8]}",
            rule_signals=signals,
            model_version=model_output.get("model_version") if model_output else None,
            prediction=model_output.get("prediction") if model_output else ("REVIEW_RECOMMENDED" if val_status == "FLAGGED" else "NORMAL"),
            probability=model_output.get("probability") if model_output else None,
            anomaly_score=model_output.get("anomaly_score") if model_output else None,
            explanation={"reasons": explanations, "suggested_action": suggested_action}
        )
        db.add(analysis_rec)

        if val_status in ("FLAGGED", "INVALID_FORMAT") or is_dup:
            rev_rec = ReviewRecord(
                identity_record_id=new_record.id,
                review_status="PENDING",
                reviewer_notes=f"Auto-queued via single record analysis: {suggested_action}"
            )
            db.add(rev_rec)

        db.commit()
        record_id_created = rec_id

    return SingleRecordAnalysisResult(
        record_id=record_id_created,
        persisted=payload.save_to_database,
        validation_status=val_status,
        data_quality_signals=[RuleSignal(**s) for s in signals],
        duplicate_matches=duplicate_matches,
        model_output=model_output,
        explanation=explanations,
        suggested_next_action=suggested_action,
        ethical_notice=settings.DISCLAIMER
    )

@router.get("/{record_id}", response_model=IdentityRecordResponse)
def get_record(record_id: str, db: Session = Depends(get_db)):
    rec = db.query(IdentityRecord).filter(
        or_(IdentityRecord.record_id == record_id, IdentityRecord.id == int(record_id) if record_id.isdigit() else False)
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    latest_analysis = None
    if rec.analysis_results:
        la = rec.analysis_results[-1]
        latest_analysis = AnalysisResultResponse(
            id=la.id,
            record_id=la.record_id,
            analysis_job_id=la.analysis_job_id,
            rule_signals=[RuleSignal(**s) for s in (la.rule_signals or [])],
            model_version=la.model_version,
            prediction=la.prediction,
            probability=la.probability,
            anomaly_score=la.anomaly_score,
            explanation=la.explanation or {},
            analyzed_at=la.analyzed_at
        )

    latest_review = None
    if rec.reviews:
        lr = rec.reviews[-1]
        latest_review = ReviewResponse(
            id=lr.id,
            identity_record_id=lr.identity_record_id,
            review_status=lr.review_status,
            reviewer_notes=lr.reviewer_notes,
            reviewed_at=lr.reviewed_at,
            created_at=lr.created_at
        )

    return IdentityRecordResponse(
        id=rec.id,
        record_id=rec.record_id,
        full_name=rec.full_name,
        normalized_name=rec.normalized_name,
        email=rec.email,
        normalized_email=rec.normalized_email,
        phone=rec.phone,
        city=rec.city,
        date_created=rec.date_created,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
        source_dataset_id=rec.source_dataset_id,
        validation_status=rec.validation_status,
        is_duplicate=rec.is_duplicate,
        duplicate_group_id=rec.duplicate_group_id,
        synthetic_label=rec.synthetic_label,
        latest_analysis=latest_analysis,
        latest_review=latest_review
    )

@router.put("/{record_id}", response_model=IdentityRecordResponse)
def update_record(record_id: str, payload: RecordUpdate, db: Session = Depends(get_db)):
    rec = db.query(IdentityRecord).filter(IdentityRecord.record_id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if payload.full_name is not None:
        rec.full_name = payload.full_name
        rec.normalized_name = normalize_name(payload.full_name)
    if payload.email is not None:
        rec.email = payload.email
        rec.normalized_email = normalize_email(payload.email)
    if payload.phone is not None:
        rec.phone = payload.phone
    if payload.city is not None:
        rec.city = payload.city
    if payload.validation_status is not None:
        rec.validation_status = payload.validation_status

    rec.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return get_record(record_id=record_id, db=db)
