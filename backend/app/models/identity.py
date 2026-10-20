import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    source_type = Column(String(50), default="CSV_UPLOAD") # CSV_UPLOAD, SYNTHETIC_GENERATOR, MANUAL_ENTRY
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    processing_status = Column(String(50), default="COMPLETED") # PROCESSING, COMPLETED, FAILED

    records = relationship("IdentityRecord", back_populates="dataset", cascade="all, delete-orphan")


class IdentityRecord(Base):
    __tablename__ = "identity_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    email = Column(String(255), nullable=True)
    normalized_email = Column(String(255), index=True, nullable=True)
    phone = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    date_created = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    source_dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    validation_status = Column(String(50), default="VALID", index=True) # VALID, INVALID_FORMAT, MISSING_FIELDS, FLAGGED
    is_duplicate = Column(Boolean, default=False, index=True)
    duplicate_group_id = Column(String(100), nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)
    synthetic_label = Column(Integer, nullable=True) # 0: Normal, 1: Artificial/Suspicious demo label

    dataset = relationship("Dataset", back_populates="records")
    analysis_results = relationship("AnalysisResult", back_populates="record", cascade="all, delete-orphan")
    reviews = relationship("ReviewRecord", back_populates="record", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_norm_name_email", "normalized_name", "normalized_email"),
    )


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("identity_records.id", ondelete="CASCADE"), nullable=False)
    analysis_job_id = Column(String(100), index=True, nullable=False)
    rule_signals = Column(JSON, nullable=True) # List of triggered validation/pattern rules
    model_version = Column(String(100), nullable=True)
    prediction = Column(String(50), nullable=True) # NORMAL, REVIEW_RECOMMENDED, ANOMALY_DETECTED
    probability = Column(Float, nullable=True) # Confidence or probability (0.0 - 1.0)
    anomaly_score = Column(Float, nullable=True) # Isolation forest score
    explanation = Column(JSON, nullable=True) # Structured rationale for human review
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)

    record = relationship("IdentityRecord", back_populates="analysis_results")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    identity_record_id = Column(Integer, ForeignKey("identity_records.id", ondelete="CASCADE"), nullable=False)
    review_status = Column(String(50), default="PENDING", index=True) # PENDING, CONFIRMED_ISSUE, FALSE_POSITIVE, APPROVED, DISMISSED
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    record = relationship("IdentityRecord", back_populates="reviews")


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False) # LogisticRegression, RandomForest, IsolationForest
    model_version = Column(String(100), index=True, nullable=False)
    training_dataset = Column(String(255), nullable=False)
    metrics = Column(JSON, nullable=False) # accuracy, precision, recall, f1, roc_auc, confusion_matrix, etc.
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="ACTIVE") # ACTIVE, ARCHIVED
