import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fake Name & Synthetic Identity Analytics System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ROOT_DIR: Path = BASE_DIR.parent
    MODEL_DIR: Path = BASE_DIR / "app" / "ml" / "artifacts"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    REPORTS_DIR: Path = ROOT_DIR / "reports"
    
    # Database
    # Default to SQLite for zero-setup out of the box; supports MySQL 8 via env var
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/identity_analytics.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Ethics & synthetic data notice
    DISCLAIMER: str = (
        "RESEARCH & ANALYTICS DEMONSTRATION NOTICE: This platform utilizes synthetic data and heuristic/ML signals "
        "to assist human analysts in detecting artificial or malformed records. Unusual names or non-Western naming "
        "conventions are not proof of fraudulent activity. No protected attributes (race, religion, gender, etc.) "
        "are ever used for scoring."
    )

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure necessary directories exist
settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
