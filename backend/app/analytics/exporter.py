import csv
import json
import io
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.identity import IdentityRecord, AnalysisResult, ReviewRecord, ModelRun
from app.analytics.eda import compute_eda_metrics
from app.core.config import settings

def export_all_power_bi_csvs(db: Session) -> Dict[str, str]:
    """
    Generates all 6 standardized CSV files configured for Microsoft Power BI Desktop import.
    Saves them to the reports/ directory and returns their filepaths.
    """
    reports_dir = settings.REPORTS_DIR
    reports_dir.mkdir(parents=True, exist_ok=True)
    generated_files = {}

    eda = compute_eda_metrics(db)
    records = db.query(IdentityRecord).all()
    reviews = db.query(ReviewRecord).all()
    models = db.query(ModelRun).all()

    # 1. dashboard_summary.csv
    summary_path = reports_dir / "dashboard_summary.csv"
    with open(summary_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metric_name", "metric_value", "metric_category", "exported_at"])
        now_iso = datetime.datetime.utcnow().isoformat()
        writer.writerow(["Total Records", eda.get("total_records", 0), "Overview", now_iso])
        writer.writerow(["Duplicate Records", eda.get("duplicates", {}).get("duplicate_records_count", 0), "Duplicates", now_iso])
        writer.writerow(["Duplicate Groups", eda.get("duplicates", {}).get("duplicate_groups", 0), "Duplicates", now_iso])
        writer.writerow(["Pass Rate (%)", eda.get("quality_before_after", {}).get("pass_rate_percentage", 0), "Quality", now_iso])
        writer.writerow(["Missing Email (%)", eda.get("missing_values", {}).get("email", 0), "Missing Data", now_iso])
        writer.writerow(["Missing Phone (%)", eda.get("missing_values", {}).get("phone", 0), "Missing Data", now_iso])
        writer.writerow(["Missing City (%)", eda.get("missing_values", {}).get("city", 0), "Missing Data", now_iso])
    generated_files["dashboard_summary"] = str(summary_path)

    # 2. data_quality_metrics.csv
    quality_path = reports_dir / "data_quality_metrics.csv"
    with open(quality_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metric_name", "count", "percentage", "quality_stage"])
        tot = max(1, eda.get("total_records", 1))
        p_dist = eda.get("special_pattern_distribution", {})
        writer.writerow(["Has Digits in Name", p_dist.get("has_digits", 0), round(p_dist.get("has_digits", 0)/tot*100, 2), "Pre-Cleaning"])
        writer.writerow(["Has Special Characters", p_dist.get("has_special_chars", 0), round(p_dist.get("has_special_chars", 0)/tot*100, 2), "Pre-Cleaning"])
        writer.writerow(["Whitespace Anomaly", p_dist.get("has_whitespace_issues", 0), round(p_dist.get("has_whitespace_issues", 0)/tot*100, 2), "Pre-Cleaning"])
        writer.writerow(["Single Word Name", p_dist.get("single_word_name", 0), round(p_dist.get("single_word_name", 0)/tot*100, 2), "Informatve"])
        writer.writerow(["Clean Standardized Records", eda.get("quality_before_after", {}).get("clean_standardized_records", 0), eda.get("quality_before_after", {}).get("pass_rate_percentage", 0), "Post-Cleaning"])
    generated_files["data_quality_metrics"] = str(quality_path)

    # 3. duplicate_analysis.csv
    dup_path = reports_dir / "duplicate_analysis.csv"
    with open(dup_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["record_id", "duplicate_group_id", "normalized_name", "normalized_email", "phone", "is_duplicate"])
        for r in records:
            if r.is_duplicate:
                writer.writerow([r.record_id, r.duplicate_group_id, r.normalized_name, r.normalized_email, r.phone, r.is_duplicate])
    generated_files["duplicate_analysis"] = str(dup_path)

    # 4. record_analysis_results.csv
    rec_path = reports_dir / "record_analysis_results.csv"
    with open(rec_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "record_id", "full_name", "email", "phone", "city", "validation_status",
            "is_duplicate", "synthetic_label", "prediction", "probability", "created_at"
        ])
        for r in records:
            latest_res = r.analysis_results[-1] if r.analysis_results else None
            writer.writerow([
                r.record_id,
                r.full_name,
                r.email or "",
                r.phone or "",
                r.city or "",
                r.validation_status,
                r.is_duplicate,
                r.synthetic_label if r.synthetic_label is not None else "",
                latest_res.prediction if latest_res else "",
                latest_res.probability if latest_res and latest_res.probability is not None else "",
                r.created_at.isoformat() if r.created_at else ""
            ])
    generated_files["record_analysis_results"] = str(rec_path)

    # 5. model_metrics.csv
    model_path = reports_dir / "model_metrics.csv"
    with open(model_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["model_name", "model_version", "accuracy", "precision", "recall", "f1_score", "roc_auc", "trained_at"])
        for m in models:
            metrics = m.metrics or {}
            writer.writerow([
                m.model_name,
                m.model_version,
                metrics.get("accuracy", ""),
                metrics.get("precision", ""),
                metrics.get("recall", ""),
                metrics.get("f1_score", ""),
                metrics.get("roc_auc", ""),
                m.trained_at.isoformat() if m.trained_at else ""
            ])
    generated_files["model_metrics"] = str(model_path)

    # 6. review_summary.csv
    rev_path = reports_dir / "review_summary.csv"
    with open(rev_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["review_id", "record_id", "review_status", "reviewer_notes", "created_at", "reviewed_at"])
        for rev in reviews:
            rec = rev.record
            writer.writerow([
                rev.id,
                rec.record_id if rec else "",
                rev.review_status,
                rev.reviewer_notes or "",
                rev.created_at.isoformat() if rev.created_at else "",
                rev.reviewed_at.isoformat() if rev.reviewed_at else ""
            ])
    generated_files["review_summary"] = str(rev_path)

    return generated_files

def generate_report_export(db: Session, export_format: str = "json") -> str:
    """
    Generates a consolidated analytical report in JSON or CSV format.
    """
    eda = compute_eda_metrics(db)
    records = db.query(IdentityRecord).all()
    reviews = db.query(ReviewRecord).all()
    models = db.query(ModelRun).all()

    report_payload = {
        "metadata": {
            "report_name": "Synthetic Identity Analytics Comprehensive Audit",
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "environment": "Local Development / Antigravity System",
            "disclaimer": settings.DISCLAIMER
        },
        "overview": eda,
        "model_performance": [
            {
                "model_name": m.model_name,
                "model_version": m.model_version,
                "metrics": m.metrics,
                "trained_at": m.trained_at.isoformat() if m.trained_at else None
            }
            for m in models
        ],
        "review_queue_summary": {
            "total_reviews": len(reviews),
            "status_counts": {
                status: sum(1 for rev in reviews if rev.review_status == status)
                for status in ["PENDING", "CONFIRMED_ISSUE", "FALSE_POSITIVE", "APPROVED", "DISMISSED"]
            }
        },
        "records_sample_count": len(records)
    }

    if export_format.lower() == "json":
        return json.dumps(report_payload, indent=2)

    # If CSV format requested: return consolidated records table with analytical flags
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "record_id", "full_name", "normalized_name", "email", "phone", "city",
        "validation_status", "is_duplicate", "duplicate_group_id", "synthetic_label",
        "created_at"
    ])
    for r in records:
        writer.writerow([
            r.record_id,
            r.full_name,
            r.normalized_name,
            r.email or "",
            r.phone or "",
            r.city or "",
            r.validation_status,
            r.is_duplicate,
            r.duplicate_group_id or "",
            r.synthetic_label if r.synthetic_label is not None else "",
            r.created_at.isoformat() if r.created_at else ""
        ])
    return output.getvalue()
