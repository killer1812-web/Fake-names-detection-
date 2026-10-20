from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.models.identity import IdentityRecord, ModelRun
from app.schemas.identity import ModelTrainRequest
from app.ml.pipeline import train_and_evaluate_models
from app.ml.model_manager import model_manager
from app.core.config import settings

router = APIRouter()

@router.get("/status")
def get_model_status(db: Session = Depends(get_db)):
    active_runs = db.query(ModelRun).filter(ModelRun.status == "ACTIVE").all()
    all_runs_count = db.query(ModelRun).count()
    labeled_count = db.query(IdentityRecord).filter(IdentityRecord.synthetic_label != None).count()

    return {
        "is_trained": model_manager.is_trained(),
        "active_model_version": model_manager.model_version,
        "available_labeled_records": labeled_count,
        "total_model_runs_logged": all_runs_count,
        "active_models": [
            {
                "id": m.id,
                "model_name": m.model_name,
                "model_version": m.model_version,
                "trained_at": m.trained_at.isoformat() if m.trained_at else None,
                "accuracy": (m.metrics or {}).get("accuracy"),
                "f1_score": (m.metrics or {}).get("f1_score")
            }
            for m in active_runs
        ],
        "ethical_disclaimer": settings.DISCLAIMER
    }

@router.post("/train")
def train_models(
    payload: ModelTrainRequest,
    db: Session = Depends(get_db)
):
    labeled_records = db.query(
        IdentityRecord.full_name,
        IdentityRecord.email,
        IdentityRecord.phone,
        IdentityRecord.city,
        IdentityRecord.is_duplicate,
        IdentityRecord.synthetic_label
    ).filter(IdentityRecord.synthetic_label != None).all()

    if len(labeled_records) < 50:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient labeled training examples: found {len(labeled_records)}. "
                "At least 50 labeled synthetic records are required to train supervised models."
            )
        )

    records_data = [
        {
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "city": r.city,
            "is_duplicate": r.is_duplicate,
            "synthetic_label": r.synthetic_label
        }
        for r in labeled_records
    ]

    try:
        results = train_and_evaluate_models(
            records_with_labels=records_data,
            test_size=payload.test_size,
            random_seed=payload.random_seed
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

    # Archive previous active runs
    db.query(ModelRun).filter(ModelRun.status == "ACTIVE").update({"status": "ARCHIVED"})

    # Save new model runs
    for m_key, m_val in results["models"].items():
        run = ModelRun(
            model_name=m_val["model_name"],
            model_version=f"{results['model_version']}_{m_key}",
            training_dataset="Internal Labeled Synthetic Dataset",
            metrics=m_val,
            status="ACTIVE" if m_key == results["selected_best_model"] else "ARCHIVED"
        )
        db.add(run)

    db.commit()

    # Reload active models
    model_manager.load_latest_models()

    return {
        "status": "success",
        "message": f"Successfully trained and evaluated models. Selected best model: {results['selected_best_model']}",
        "version": results["model_version"],
        "results": results
    }

@router.get("/metrics")
def get_model_metrics(db: Session = Depends(get_db)):
    runs = db.query(ModelRun).order_by(ModelRun.id.desc()).limit(10).all()
    if not runs:
        return {
            "is_trained": False,
            "message": "No model runs recorded. Trigger training to evaluate models.",
            "runs": []
        }

    return {
        "is_trained": model_manager.is_trained(),
        "active_version": model_manager.model_version,
        "runs": [
            {
                "id": r.id,
                "model_name": r.model_name,
                "model_version": r.model_version,
                "training_dataset": r.training_dataset,
                "status": r.status,
                "trained_at": r.trained_at.isoformat() if r.trained_at else None,
                "metrics": r.metrics
            }
            for r in runs
        ]
    }
