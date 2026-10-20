export interface RuleSignal {
  rule_id: string;
  rule_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detected_value?: string;
}

export interface AnalysisResult {
  id?: number;
  record_id?: number;
  analysis_job_id: string;
  rule_signals: RuleSignal[];
  model_version?: string;
  prediction?: 'NORMAL' | 'REVIEW_RECOMMENDED' | string;
  probability?: number | null;
  anomaly_score?: number | null;
  explanation: {
    reasons?: string[];
    suggested_action?: string;
    status?: string;
  };
  analyzed_at?: string;
}

export interface ReviewRecord {
  id: number;
  identity_record_id: number;
  review_status: 'PENDING' | 'CONFIRMED_ISSUE' | 'FALSE_POSITIVE' | 'APPROVED' | 'DISMISSED';
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface IdentityRecord {
  id: number;
  record_id: string;
  full_name: string;
  normalized_name: string;
  email?: string;
  normalized_email?: string;
  phone?: string;
  city?: string;
  date_created?: string;
  created_at: string;
  updated_at: string;
  source_dataset_id?: number;
  validation_status: 'VALID' | 'FLAGGED' | 'INVALID_FORMAT' | 'MISSING_FIELDS';
  is_duplicate: boolean;
  duplicate_group_id?: string;
  synthetic_label?: number | null;
  latest_analysis?: AnalysisResult;
  latest_review?: ReviewRecord;
}

export interface PaginatedRecords {
  items: IdentityRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardSummary {
  total_records: number;
  records_analyzed: number;
  records_flagged_for_review: number;
  duplicate_record_groups: number;
  missing_or_invalid_fields: number;
  records_awaiting_review: number;
  total_analysis_jobs: number;
  most_recent_analysis_date?: string;
  quality_pass_rate: number;
  ethical_notice: string;
}

export interface TrendPoint {
  date: string;
  total_records: number;
  flagged_records: number;
  valid_records: number;
}

export interface DashboardTrends {
  trends: TrendPoint[];
  review_status_distribution: Record<string, number>;
  data_quality_breakdown: Record<string, number>;
  model_prediction_distribution: Record<string, number>;
}

export interface SingleRecordAnalysisResult {
  record_id?: string;
  persisted: boolean;
  validation_status: string;
  data_quality_signals: RuleSignal[];
  duplicate_matches: Array<{
    match_type: string;
    confidence: number;
    matched_record_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    note: string;
  }>;
  model_output?: {
    model_version: string;
    prediction: string;
    probability: number;
    anomaly_detected?: boolean;
    anomaly_score?: number;
    disclaimer: string;
  } | null;
  explanation: string[];
  suggested_next_action: string;
  ethical_notice: string;
}

export interface ModelMetricsData {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc?: number;
  confusion_matrix: number[][];
  false_positives: number;
  false_negatives: number;
  feature_importances?: Record<string, number>;
  coefficients?: Record<string, number>;
  note?: string;
}

export interface ModelRunItem {
  id: number;
  model_name: string;
  model_version: string;
  training_dataset: string;
  status: string;
  trained_at?: string;
  metrics: ModelMetricsData;
}
