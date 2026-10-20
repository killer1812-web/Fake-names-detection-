from app.db.session import Base
# Import all models here so that Base.metadata has them registered
from app.models.identity import (
    IdentityRecord,
    Dataset,
    AnalysisResult,
    ReviewRecord,
    ModelRun,
)

__all__ = [
    "Base",
    "IdentityRecord",
    "Dataset",
    "AnalysisResult",
    "ReviewRecord",
    "ModelRun",
]
