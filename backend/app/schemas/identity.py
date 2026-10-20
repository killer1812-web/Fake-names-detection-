from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RecordBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    date_created: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class RecordCreate(RecordBase):
    record_id: Optional[str] = None
    source_dataset_id: Optional[int] = None

class RecordUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    validation_status: Optional[str] = None

class RuleSignal(BaseModel):
    rule_id: str
    rule_name: str
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    detected_value: Optional[str] = None

class AnalysisResultResponse(BaseModel):
    id: Optional[int] = None
    record_id: Optional[int] = None
    analysis_job_id: str
    rule_signals: List[RuleSignal] = []
    model_version: Optional[str] = None
    prediction: Optional[str] = None
    probability: Optional[float] = None
    anomaly_score: Optional[float] = None
    explanation: Dict[str, Any] = {}
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    identity_record_id: int
    review_status: str
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    identity_record_id: int
    review_status: str = Field(..., description="PENDING, CONFIRMED_ISSUE, FALSE_POSITIVE, APPROVED, DISMISSED")
    reviewer_notes: Optional[str] = None

class ReviewUpdate(BaseModel):
    review_status: str
    reviewer_notes: Optional[str] = None

class IdentityRecordResponse(BaseModel):
    id: int
    record_id: str
    full_name: str
    normalized_name: str
    email: Optional[str] = None
    normalized_email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    date_created: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    source_dataset_id: Optional[int] = None
    validation_status: str
    is_duplicate: bool
    duplicate_group_id: Optional[str] = None
    synthetic_label: Optional[int] = None
    latest_analysis: Optional[AnalysisResultResponse] = None
    latest_review: Optional[ReviewResponse] = None

    class Config:
        from_attributes = True

class SingleRecordAnalysisRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    date_created: Optional[str] = None
    save_to_database: bool = False

class SingleRecordAnalysisResult(BaseModel):
    record_id: Optional[str] = None
    persisted: bool = False
    validation_status: str
    data_quality_signals: List[RuleSignal]
    duplicate_matches: List[Dict[str, Any]]
    model_output: Optional[Dict[str, Any]] = None
    explanation: List[str]
    suggested_next_action: str
    ethical_notice: str

class PaginatedRecordsResponse(BaseModel):
    items: List[IdentityRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class DashboardSummaryResponse(BaseModel):
    total_records: int
    records_analyzed: int
    records_flagged_for_review: int
    duplicate_record_groups: int
    missing_or_invalid_fields: int
    records_awaiting_review: int
    total_analysis_jobs: int
    most_recent_analysis_date: Optional[str] = None
    quality_pass_rate: float
    ethical_notice: str

class TrendPoint(BaseModel):
    date: str
    total_records: int
    flagged_records: int
    valid_records: int

class DashboardTrendsResponse(BaseModel):
    trends: List[TrendPoint]
    review_status_distribution: Dict[str, int]
    data_quality_breakdown: Dict[str, int]
    model_prediction_distribution: Dict[str, int]

class ModelTrainRequest(BaseModel):
    model_type: str = Field("all", description="all, logistic_regression, random_forest, isolation_forest")
    test_size: float = Field(0.2, ge=0.1, le=0.5)
    random_seed: int = 42

class DatasetResponse(BaseModel):
    id: int
    dataset_name: str
    source_type: str
    total_records: int
    processed_records: int
    failed_records: int
    uploaded_at: datetime
    processing_status: str

    class Config:
        from_attributes = True
