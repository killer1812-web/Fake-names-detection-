from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.analytics.eda import compute_eda_metrics
from app.models.identity import IdentityRecord

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    return compute_eda_metrics(db)

@router.get("/data-quality")
def get_data_quality_metrics(db: Session = Depends(get_db)):
    eda = compute_eda_metrics(db)
    return {
        "total_records": eda.get("total_records", 0),
        "missing_values": eda.get("missing_values", {}),
        "special_pattern_distribution": eda.get("special_pattern_distribution", {}),
        "validation_failures": eda.get("validation_failures", {}),
        "quality_before_after": eda.get("quality_before_after", {}),
        "ethical_note": eda.get("ethical_note")
    }

@router.get("/duplicates")
def get_duplicate_analytics(db: Session = Depends(get_db)):
    eda = compute_eda_metrics(db)
    
    # Fetch sample duplicate records grouped
    dup_records = db.query(
        IdentityRecord.record_id,
        IdentityRecord.duplicate_group_id,
        IdentityRecord.full_name,
        IdentityRecord.email,
        IdentityRecord.phone,
        IdentityRecord.city,
        IdentityRecord.created_at
    ).filter(IdentityRecord.is_duplicate == True).limit(100).all()

    groups = {}
    for r in dup_records:
        grp = r.duplicate_group_id or "UNGROUPED"
        if grp not in groups:
            groups[grp] = []
        groups[grp].append({
            "record_id": r.record_id,
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "city": r.city,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "summary": eda.get("duplicates", {}),
        "duplicate_groups_sample": [
            {"group_id": gid, "records": recs, "size": len(recs)}
            for gid, recs in groups.items()
        ]
    }
