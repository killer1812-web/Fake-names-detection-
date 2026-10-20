from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.identity import IdentityRecord, AnalysisResult, ReviewRecord, ModelRun
import re

def compute_eda_metrics(db: Session) -> Dict[str, Any]:
    """
    Computes comprehensive Exploratory Data Analysis metrics from persisted database records.
    """
    total_records = db.query(IdentityRecord).count()
    if total_records == 0:
        return {
            "total_records": 0,
            "missing_values": {},
            "duplicates": {"exact_count": 0, "duplicate_groups": 0},
            "name_length_distribution": [],
            "special_pattern_distribution": {},
            "validation_failures": {},
            "label_distribution": {},
            "quality_before_after": {},
            "message": "No identity records in database yet. Upload a CSV dataset or generate synthetic records."
        }

    # Missing values
    missing_email = db.query(IdentityRecord).filter(
        (IdentityRecord.email == None) | (IdentityRecord.email == "")
    ).count()
    missing_phone = db.query(IdentityRecord).filter(
        (IdentityRecord.phone == None) | (IdentityRecord.phone == "")
    ).count()
    missing_city = db.query(IdentityRecord).filter(
        (IdentityRecord.city == None) | (IdentityRecord.city == "")
    ).count()

    missing_percentages = {
        "email": round((missing_email / total_records) * 100, 2),
        "phone": round((missing_phone / total_records) * 100, 2),
        "city": round((missing_city / total_records) * 100, 2),
    }

    # Duplicate statistics
    duplicate_count = db.query(IdentityRecord).filter(IdentityRecord.is_duplicate == True).count()
    group_count = db.query(IdentityRecord.duplicate_group_id).filter(
        IdentityRecord.duplicate_group_id != None
    ).distinct().count()

    # Name length distribution & character pattern analysis
    records = db.query(IdentityRecord.full_name, IdentityRecord.validation_status, IdentityRecord.synthetic_label).all()
    
    length_buckets = {
        "Under 5": 0,
        "5 - 10": 0,
        "11 - 15": 0,
        "16 - 20": 0,
        "21 - 25": 0,
        "26 - 35": 0,
        "Over 35": 0
    }

    pattern_counts = {
        "has_digits": 0,
        "has_special_chars": 0,
        "has_whitespace_issues": 0,
        "single_word_name": 0,
        "three_or_more_words": 0
    }

    val_failures = {}
    label_counts = {"Normal (0)": 0, "Artificial/Review (1)": 0, "Unlabeled": 0}

    for name, v_status, synth_label in records:
        n_str = str(name or "")
        n_len = len(n_str.strip())

        # Length buckets
        if n_len < 5:
            length_buckets["Under 5"] += 1
        elif n_len <= 10:
            length_buckets["5 - 10"] += 1
        elif n_len <= 15:
            length_buckets["11 - 15"] += 1
        elif n_len <= 20:
            length_buckets["16 - 20"] += 1
        elif n_len <= 25:
            length_buckets["21 - 25"] += 1
        elif n_len <= 35:
            length_buckets["26 - 35"] += 1
        else:
            length_buckets["Over 35"] += 1

        # Patterns
        if re.search(r"\d", n_str):
            pattern_counts["has_digits"] += 1
        if re.search(r"[!@#$%^&*()_+=\[\]{};:\"\\|<>,/?~`]", n_str):
            pattern_counts["has_special_chars"] += 1
        if "  " in n_str or n_str.startswith(" ") or n_str.endswith(" "):
            pattern_counts["has_whitespace_issues"] += 1
        words = n_str.strip().split()
        if len(words) == 1:
            pattern_counts["single_word_name"] += 1
        elif len(words) >= 3:
            pattern_counts["three_or_more_words"] += 1

        # Status
        status_key = v_status or "UNKNOWN"
        val_failures[status_key] = val_failures.get(status_key, 0) + 1

        # Labels
        if synth_label == 0:
            label_counts["Normal (0)"] += 1
        elif synth_label == 1:
            label_counts["Artificial/Review (1)"] += 1
        else:
            label_counts["Unlabeled"] += 1

    # Format length buckets for charts
    name_len_dist = [{"bucket": k, "count": v} for k, v in length_buckets.items()]

    # Quality before and after cleaning
    unclean_count = (
        pattern_counts["has_digits"]
        + pattern_counts["has_special_chars"]
        + pattern_counts["has_whitespace_issues"]
        + val_failures.get("INVALID_FORMAT", 0)
    )
    clean_count = max(0, total_records - unclean_count)

    quality_before_after = {
        "raw_records_with_quality_flags": unclean_count,
        "clean_standardized_records": clean_count,
        "pass_rate_percentage": round((clean_count / total_records) * 100, 2)
    }

    return {
        "total_records": total_records,
        "missing_values": missing_percentages,
        "duplicates": {
            "duplicate_records_count": duplicate_count,
            "duplicate_groups": group_count,
            "duplicate_percentage": round((duplicate_count / total_records) * 100, 2)
        },
        "name_length_distribution": name_len_dist,
        "special_pattern_distribution": pattern_counts,
        "validation_failures": val_failures,
        "label_distribution": label_counts,
        "quality_before_after": quality_before_after,
        "ethical_note": (
            "Name length variations reflect natural multilingual and multicultural diversity. "
            "A name being short or long is an analytical attribute, never an indicator of fraudulent intent."
        )
    }
