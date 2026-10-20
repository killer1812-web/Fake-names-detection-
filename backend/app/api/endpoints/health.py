from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.ml.model_manager import model_manager

router = APIRouter()

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "connected": db_connected,
            "url_type": "mysql" if "mysql" in settings.DATABASE_URL else "sqlite"
        },
        "model_manager": {
            "trained": model_manager.is_trained(),
            "active_version": model_manager.model_version
        },
        "ethical_disclaimer": settings.DISCLAIMER
    }
