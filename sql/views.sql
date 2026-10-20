-- ====================================================================
-- FAKE NAME & SYNTHETIC IDENTITY ANALYTICS SYSTEM
-- Analytical SQL Views for Business Intelligence & Reporting
-- Compatible with MySQL 8.0+ and SQLite 3
-- ====================================================================

-- 1. View: Identity Quality & Status Summary
CREATE VIEW IF NOT EXISTS vw_identity_summary AS
SELECT 
    r.id,
    r.record_id,
    r.full_name,
    r.normalized_name,
    r.email,
    r.phone,
    r.city,
    r.date_created,
    r.validation_status,
    r.is_duplicate,
    r.duplicate_group_id,
    r.synthetic_label,
    a.prediction AS latest_ml_prediction,
    a.probability AS latest_ml_probability,
    a.anomaly_score AS latest_anomaly_score,
    rev.review_status AS current_review_status,
    r.created_at
FROM identity_records r
LEFT JOIN (
    SELECT a1.*
    FROM analysis_results a1
    INNER JOIN (
        SELECT record_id, MAX(id) AS max_id
        FROM analysis_results
        GROUP BY record_id
    ) a2 ON a1.id = a2.max_id
) a ON r.id = a.record_id
LEFT JOIN (
    SELECT rev1.*
    FROM review_records rev1
    INNER JOIN (
        SELECT identity_record_id, MAX(id) AS max_id
        FROM review_records
        GROUP BY identity_record_id
    ) rev2 ON rev1.id = rev2.max_id
) rev ON r.id = rev.identity_record_id;

-- 2. View: Duplicate Record Clusters
CREATE VIEW IF NOT EXISTS vw_duplicate_clusters AS
SELECT 
    duplicate_group_id,
    COUNT(*) AS records_in_group,
    COUNT(DISTINCT full_name) AS distinct_names_count,
    COUNT(DISTINCT email) AS distinct_emails_count,
    COUNT(DISTINCT phone) AS distinct_phones_count,
    MIN(created_at) AS first_seen_at,
    MAX(created_at) AS last_seen_at
FROM identity_records
WHERE is_duplicate = 1 AND duplicate_group_id IS NOT NULL
GROUP BY duplicate_group_id;

-- 3. View: Data Quality Metrics Summary
CREATE VIEW IF NOT EXISTS vw_data_quality_report AS
SELECT 
    validation_status,
    COUNT(*) AS total_records,
    SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) AS duplicate_records,
    SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) AS missing_email_count,
    SUM(CASE WHEN phone IS NULL OR phone = '' THEN 1 ELSE 0 END) AS missing_phone_count,
    SUM(CASE WHEN city IS NULL OR city = '' THEN 1 ELSE 0 END) AS missing_city_count
FROM identity_records
GROUP BY validation_status;

-- 4. View: Pending Human Review Queue
CREATE VIEW IF NOT EXISTS vw_pending_reviews AS
SELECT 
    rev.id AS review_id,
    r.record_id,
    r.full_name,
    r.email,
    r.phone,
    r.validation_status,
    r.is_duplicate,
    rev.review_status,
    rev.reviewer_notes,
    rev.created_at AS queued_at
FROM review_records rev
JOIN identity_records r ON rev.identity_record_id = r.id
WHERE rev.review_status = 'PENDING';
