from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.db.session import get_db
from app.models.identity import IdentityRecord, AnalysisResult, ReviewRecord, Dataset
from app.schemas.identity import DashboardSummaryResponse, DashboardTrendsResponse, TrendPoint
from app.core.config import settings

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_records = db.query(IdentityRecord).count()
    if total_records == 0:
        return DashboardSummaryResponse(
            total_records=0,
            records_analyzed=0,
            records_flagged_for_review=0,
            duplicate_record_groups=0,
            missing_or_invalid_fields=0,
            records_awaiting_review=0,
            total_analysis_jobs=0,
            most_recent_analysis_date=None,
            quality_pass_rate=100.0,
            ethical_notice=settings.DISCLAIMER
        )

    records_analyzed = db.query(AnalysisResult.record_id).distinct().count()
    flagged_records = db.query(IdentityRecord).filter(
        IdentityRecord.validation_status.in_(["FLAGGED", "INVALID_FORMAT"])
    ).count()

    duplicate_groups = db.query(IdentityRecord.duplicate_group_id).filter(
        IdentityRecord.duplicate_group_id != None
    ).distinct().count()

    missing_fields = db.query(IdentityRecord).filter(
        (IdentityRecord.email == None) | (IdentityRecord.email == "") |
        (IdentityRecord.phone == None) | (IdentityRecord.phone == "") |
        (IdentityRecord.city == None) | (IdentityRecord.city == "")
    ).count()

    awaiting_review = db.query(ReviewRecord).filter(
        ReviewRecord.review_status == "PENDING"
    ).count()

    total_jobs = db.query(Dataset).count()
    latest_analysis = db.query(func.max(AnalysisResult.analyzed_at)).scalar()

    pass_rate = round(((total_records - flagged_records) / total_records) * 100, 2)

    return DashboardSummaryResponse(
        total_records=total_records,
        records_analyzed=records_analyzed,
        records_flagged_for_review=flagged_records,
        duplicate_record_groups=duplicate_groups,
        missing_or_invalid_fields=missing_fields,
        records_awaiting_review=awaiting_review,
        total_analysis_jobs=total_jobs,
        most_recent_analysis_date=latest_analysis.isoformat() if latest_analysis else None,
        quality_pass_rate=pass_rate,
        ethical_notice=settings.DISCLAIMER
    )

@router.get("/trends", response_model=DashboardTrendsResponse)
def get_dashboard_trends(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    # Group records by date_created or created_at
    records = db.query(
        IdentityRecord.date_created,
        IdentityRecord.validation_status
    ).all()

    date_agg = {}
    review_status_dist = {
        "PENDING": 0, "CONFIRMED_ISSUE": 0, "FALSE_POSITIVE": 0, "APPROVED": 0, "DISMISSED": 0
    }
    data_quality_dist = {
        "VALID": 0, "FLAGGED": 0, "INVALID_FORMAT": 0, "MISSING_FIELDS": 0
    }
    model_pred_dist = {
        "NORMAL": 0, "REVIEW_RECOMMENDED": 0
    }

    for r_date, v_status in records:
        d_key = r_date if r_date else "Recent"
        if d_key not in date_agg:
            date_agg[d_key] = {"total": 0, "flagged": 0, "valid": 0}
        date_agg[d_key]["total"] += 1
        if v_status in ("FLAGGED", "INVALID_FORMAT"):
            date_agg[d_key]["flagged"] += 1
            data_quality_dist[v_status] = data_quality_dist.get(v_status, 0) + 1
        else:
            date_agg[d_key]["valid"] += 1
            data_quality_dist[v_status] = data_quality_dist.get(v_status, 0) + 1

    # Populate review distribution
    reviews = db.query(ReviewRecord.review_status).all()
    for (r_stat,) in reviews:
        review_status_dist[r_stat] = review_status_dist.get(r_stat, 0) + 1

    # Populate model prediction distribution
    predictions = db.query(AnalysisResult.prediction).all()
    for (pred,) in predictions:
        if pred:
            model_pred_dist[pred] = model_pred_dist.get(pred, 0) + 1

    # Sort dates and pick recent points
    sorted_dates = sorted([k for k in date_agg.keys() if k != "Recent"])[-15:]
    trend_points = [
        TrendPoint(
            date=d,
            total_records=date_agg[d]["total"],
            flagged_records=date_agg[d]["flagged"],
            valid_records=date_agg[d]["valid"]
        )
        for d in sorted_dates
    ]

    return DashboardTrendsResponse(
        trends=trend_points,
        review_status_distribution=review_status_dist,
        data_quality_breakdown=data_quality_dist,
        model_prediction_distribution=model_pred_dist
    )
