# REST API Specification

Base URL: `http://127.0.0.1:8000/api`  
Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`  
ReDoc Documentation: `http://127.0.0.1:8000/redoc`

---

## 1. System Health

### `GET /health`
Returns system status, database connectivity, and active ML model version.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "project": "Fake Name & Synthetic Identity Analytics System",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "url_type": "sqlite"
  },
  "model_manager": {
    "trained": true,
    "active_version": "v20261020_181636"
  },
  "ethical_disclaimer": "..."
}
```

---

## 2. Dashboard Endpoints

### `GET /dashboard/summary`
Returns live platform KPIs.

### `GET /dashboard/trends?days=30`
Returns time-series volume trends, review status distribution, and validation breakdowns.

---

## 3. Records Management

### `GET /records`
Query parameters:
- `page` (default 1)
- `page_size` (default 20, max 100)
- `search` (filter by ID, name, email)
- `validation_status` (e.g. `VALID`, `FLAGGED`, `INVALID_FORMAT`)
- `review_status` (e.g. `PENDING`, `APPROVED`, `CONFIRMED_ISSUE`)
- `is_duplicate` (boolean)
- `sort_by` (field name)
- `sort_desc` (boolean)

### `POST /records/analyze-single`
Performs on-demand evaluation of a single identity record.

**Request Body:**
```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "phone": "000-000-0000",
  "city": "Metropolis",
  "date_created": "2026-03-01",
  "save_to_database": true
}
```

### `GET /records/{record_id}`
Retrieves detailed record profile, latest analysis signals, and review history.

---

## 4. Bulk Uploads

### `POST /uploads/csv`
Uploads and parses CSV dataset via `multipart/form-data`.
- `file`: CSV file (max 25MB)
- `dataset_name`: Optional custom title
- `name_col`, `email_col`, `phone_col`, `city_col`, `date_col`: Header mappings

---

## 5. Machine Learning

### `GET /models/status`
Checks if models are trained and displays available labeled records.

### `POST /models/train`
Triggers supervised and unsupervised model training.

**Request Body:**
```json
{
  "model_type": "all",
  "test_size": 0.2,
  "random_seed": 42
}
```

### `GET /models/metrics`
Returns evaluation matrices, precision, recall, F1, and feature importances.

---

## 6. Review Queue

### `GET /reviews?status=PENDING`
Lists records queued for human review.

### `PUT /reviews/{review_id}`
Updates review adjudication status (`APPROVED`, `CONFIRMED_ISSUE`, `FALSE_POSITIVE`, `DISMISSED`) and reviewer notes.

---

## 7. Reports & Power BI

### `GET /reports/export?format=json` or `format=csv`
Streams downloadable comprehensive audit export.

### `POST /reports/generate-power-bi`
Generates all 6 normalized CSV datasets directly in `reports/` folder for Power BI Desktop.
