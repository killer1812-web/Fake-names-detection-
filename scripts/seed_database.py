#!/usr/bin/env python3
"""
Database Seeding Script for Fake Name & Synthetic Identity Analytics System.
Initializes database schema, cleans and normalizes records, detects duplicates,
evaluates rule signals, persists records, and trains baseline ML models.
"""

import sys
import os
import csv
from pathlib import Path
import datetime

# Add backend and root directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.identity import IdentityRecord, Dataset, AnalysisResult, ReviewRecord, ModelRun
from app.services.cleaner import normalize_name, normalize_email, normalize_phone
from app.services.duplicate_detector import detect_duplicates_in_dataset
from app.services.rule_engine import evaluate_record_rules
from app.ml.pipeline import train_and_evaluate_models
from app.ml.model_manager import model_manager
from scripts.generate_dataset import generate_synthetic_dataset

def seed():
    print("[*] Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing_count = db.query(IdentityRecord).count()
        if existing_count > 0:
            print(f"[!] Database already populated with {existing_count} records. Skipping initial seed.")
            return

        sample_csv = Path(__file__).resolve().parent.parent / "data" / "sample" / "sample_synthetic_identities.csv"
        if not sample_csv.exists():
            print("[*] Sample CSV not found. Generating initial dataset...")
            generate_synthetic_dataset(num_records=1000)

        print(f"[*] Reading records from {sample_csv}...")
        raw_rows = []
        with open(sample_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_rows.append(row)

        print(f"[*] Processing {len(raw_rows)} records (cleaning, deduplication, rule evaluation)...")
        # Run duplicate detection clustering
        enriched_rows = detect_duplicates_in_dataset(raw_rows)

        # Create Dataset record
        dataset_obj = Dataset(
            dataset_name="Standard Synthetic Demonstration Seed (Sample)",
            source_type="SYNTHETIC_GENERATOR",
            total_records=len(enriched_rows),
            processed_records=len(enriched_rows),
            failed_records=0,
            processing_status="COMPLETED"
        )
        db.add(dataset_obj)
        db.flush()

        identity_records = []
        job_id = f"SEED-JOB-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"

        for item in enriched_rows:
            f_name = item.get("full_name", "").strip()
            n_name = normalize_name(f_name)
            email = item.get("email", "").strip() if item.get("email") else None
            n_email = normalize_email(email) if email else None
            phone = item.get("phone", "").strip() if item.get("phone") else None
            city = item.get("city", "").strip() if item.get("city") else None
            date_created = item.get("date_created")
            is_dup = bool(item.get("is_duplicate", False))
            dup_grp = item.get("duplicate_group_id")
            s_label = int(item["synthetic_label"]) if item.get("synthetic_label") not in (None, "") else None

            # Rule evaluation
            val_status, signals, explanations, suggested_action = evaluate_record_rules(
                full_name=f_name,
                email=email,
                phone=phone,
                city=city,
                date_created=date_created,
                duplicate_count=1 if is_dup else 0
            )

            rec = IdentityRecord(
                record_id=item.get("record_id"),
                full_name=f_name,
                normalized_name=n_name,
                email=email,
                normalized_email=n_email,
                phone=phone,
                city=city,
                date_created=date_created,
                source_dataset_id=dataset_obj.id,
                validation_status=val_status,
                is_duplicate=is_dup,
                duplicate_group_id=dup_grp,
                synthetic_label=s_label
            )
            db.add(rec)
            db.flush()

            # Add analysis result
            analysis = AnalysisResult(
                record_id=rec.id,
                analysis_job_id=job_id,
                rule_signals=signals,
                prediction="REVIEW_RECOMMENDED" if val_status in ("FLAGGED", "INVALID_FORMAT") else "NORMAL",
                probability=0.85 if val_status in ("FLAGGED", "INVALID_FORMAT") else 0.05,
                explanation={
                    "reasons": explanations,
                    "suggested_action": suggested_action,
                    "status": val_status
                }
            )
            db.add(analysis)

            # If flagged, populate review queue
            if val_status in ("FLAGGED", "INVALID_FORMAT") or is_dup:
                rev = ReviewRecord(
                    identity_record_id=rec.id,
                    review_status="PENDING",
                    reviewer_notes=f"Auto-queued: {suggested_action}"
                )
                db.add(rev)

            identity_records.append({
                "full_name": f_name,
                "email": email,
                "phone": phone,
                "city": city,
                "is_duplicate": is_dup,
                "synthetic_label": s_label
            })

        db.commit()
        print(f"[+] Persisted {len(identity_records)} records into the database.")

        # Train baseline machine learning models
        print("[*] Training baseline machine learning models (Logistic Regression, Random Forest, Isolation Forest)...")
        labeled_samples = [r for r in identity_records if r["synthetic_label"] is not None]
        if len(labeled_samples) >= 50:
            ml_results = train_and_evaluate_models(labeled_samples)
            
            # Save ModelRun records
            for m_key, m_val in ml_results["models"].items():
                run = ModelRun(
                    model_name=m_val["model_name"],
                    model_version=f"{ml_results['model_version']}_{m_key}",
                    training_dataset="Standard Synthetic Demonstration Seed",
                    metrics=m_val,
                    status="ACTIVE" if m_key == ml_results["selected_best_model"] else "ARCHIVED"
                )
                db.add(run)
            db.commit()
            print(f"[+] Baseline ML models trained and saved successfully (version: {ml_results['model_version']}).")
            model_manager.load_latest_models()
        else:
            print("[!] Insufficient labeled records to train initial model.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
