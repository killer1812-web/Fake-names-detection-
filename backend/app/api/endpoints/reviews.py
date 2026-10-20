import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.models.identity import ReviewRecord, IdentityRecord
from app.schemas.identity import ReviewResponse, ReviewCreate, ReviewUpdate

router = APIRouter()

@router.get("", response_model=List[dict])
def list_reviews(
    status: Optional[str] = Query(None, description="PENDING, CONFIRMED_ISSUE, FALSE_POSITIVE, APPROVED, DISMISSED"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(ReviewRecord)
    if status:
        query = query.filter(ReviewRecord.review_status == status)

    reviews = query.order_by(desc(ReviewRecord.created_at)).limit(limit).all()

    results = []
    for rev in reviews:
        rec = rev.record
        analysis = rec.analysis_results[-1] if rec and rec.analysis_results else None
        results.append({
            "id": rev.id,
            "identity_record_id": rev.identity_record_id,
            "record_id": rec.record_id if rec else None,
            "full_name": rec.full_name if rec else "Unknown",
            "email": rec.email if rec else None,
            "phone": rec.phone if rec else None,
            "validation_status": rec.validation_status if rec else "UNKNOWN",
            "is_duplicate": rec.is_duplicate if rec else False,
            "duplicate_group_id": rec.duplicate_group_id if rec else None,
            "review_status": rev.review_status,
            "reviewer_notes": rev.reviewer_notes,
            "rule_signals": analysis.rule_signals if analysis else [],
            "prediction": analysis.prediction if analysis else None,
            "probability": analysis.probability if analysis else None,
            "created_at": rev.created_at.isoformat() if rev.created_at else None,
            "reviewed_at": rev.reviewed_at.isoformat() if rev.reviewed_at else None
        })

    return results

@router.post("", response_model=ReviewResponse)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    rec = db.query(IdentityRecord).filter(IdentityRecord.id == payload.identity_record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Identity record not found")

    rev = ReviewRecord(
        identity_record_id=payload.identity_record_id,
        review_status=payload.review_status,
        reviewer_notes=payload.reviewer_notes,
        reviewed_at=datetime.datetime.utcnow() if payload.review_status != "PENDING" else None
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev

@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(review_id: int, payload: ReviewUpdate, db: Session = Depends(get_db)):
    rev = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review record not found")

    rev.review_status = payload.review_status
    if payload.reviewer_notes is not None:
        rev.reviewer_notes = payload.reviewer_notes
    rev.reviewed_at = datetime.datetime.utcnow()

    # Also sync validation status if approved or dismissed
    if rev.record:
        if payload.review_status == "APPROVED":
            rev.record.validation_status = "VALID"
        elif payload.review_status == "CONFIRMED_ISSUE":
            rev.record.validation_status = "FLAGGED"

    db.commit()
    db.refresh(rev)
    return rev
