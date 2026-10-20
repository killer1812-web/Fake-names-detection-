from fastapi import APIRouter
from app.api.endpoints import (
    health,
    dashboard,
    records,
    uploads,
    analytics,
    models,
    reviews,
    reports
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(records.router, prefix="/records", tags=["Records"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(models.router, prefix="/models", tags=["Machine Learning"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Review Queue"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
