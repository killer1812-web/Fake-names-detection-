# Fake Name & Synthetic Identity Analytics System

An enterprise-grade, end-to-end data analytics and machine learning platform built to detect artificial, duplicate, malformed, or inconsistent identity records for human review.

Designed for final-year engineering projects, academic research portfolios, and financial compliance analytics.

---

## 🛡️ Ethical & Governance Notice

> **IMPORTANT PRINCIPLE:**  
> An unusual name is **never proof of a fraudulent identity**. Human naming conventions across diverse cultures, ethnicities, and languages (e.g. single names, hyphenated names, patronymics, apostrophes) are naturally varied and legitimate.  
> 
> This platform uses **synthetic demonstration data**, explicit data quality formatting rules, and machine learning models. It presents findings as **analytical signals** or **review recommendations**, never definitive accusations. Protected characteristics (race, religion, caste, gender, nationality) are **never** used for risk scoring.

---

## 🚀 Key Features

1. **Overview Dashboard**: Live KPIs (Total Records, Analyzed, Flagged, Duplicate Clusters, Quality Pass Rate), Area Trend Charts, Review Distribution Donut Charts, and Validation Breakdown Charts.
2. **Single Record Analysis**: Real-time evaluation of an identity profile against deterministic heuristics, database duplicate scans, and active ML models with explainable rationale and suggested actions.
3. **Bulk CSV Dataset Upload**: Drag-and-drop CSV ingestion with client-side preview, automatic header detection, column mapping, validation progress, duplicate detection, and batch insertion.
4. **Records Explorer**: Searchable and filterable data grid with server-side pagination, sorting, status badges, and full-record detail inspection modal.
5. **Exploratory Data Analytics (EDA)**: Statistical distributions of name lengths, missing values, special character patterns, synthetic label distributions, and pre/post-cleaning quality improvements.
6. **Machine Learning Management**: Train and benchmark **Logistic Regression**, **Random Forest Classifier**, and **Isolation Forest** (unsupervised anomaly detection) with confusion matrices, precision, recall, F1-scores, and feature importances.
7. **Manual Review Queue**: Human-in-the-loop analyst workflow to approve legitimate records, confirm issues, mark false positives, and record reviewer audit notes.
8. **Reports & Power BI Integration**: Downloadable JSON and CSV audit reports, plus one-click generation of the 6 standardized CSV files for **Microsoft Power BI Desktop**.
9. **Settings & Health Diagnostics**: Live API health checks, database status ping, model version management, and Swagger interactive documentation portals.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, React Router, Axios
- **Backend**: Python 3.12+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, Pandas, NumPy, Scikit-learn, Joblib
- **Database**: SQLite 3 (Zero-setup local development default) / MySQL 8.0+ supported via `DATABASE_URL`
- **Testing**: Pytest, HTTPX, Vitest, React Testing Library
- **Deployment**: Docker & Docker Compose configuration included

---

## 📋 Prerequisites (Windows Development)

- **Python 3.12+**: Verify with `python --version`
- **Node.js v18+ & npm**: Verify with `node --version` and `npm --version`
- **PowerShell** or **Command Prompt**

---

## ⚡ Quick Start (One-Command Development Launcher)

You can launch both the Backend and Frontend concurrently with one command:

```powershell
.\start_dev.ps1
```
*(Or double-click `start_dev.bat`)*

---

## 📖 Step-by-Step Manual Installation & Startup

### 1. Backend Setup

Open **Terminal 1 (PowerShell)**:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

> **Tip:** If PowerShell blocks script execution, run:  
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### 2. Dataset Generation & Database Seeding

From the project root (with the backend venv active):

```powershell
# Generate 10,000 synthetic fictional records
backend\.venv\Scripts\python.exe scripts\generate_dataset.py

# Seed database schema, ingest initial records, and train baseline ML models
backend\.venv\Scripts\python.exe scripts\seed_database.py
```

### 3. Start Backend Server

```powershell
cd backend
..\backend\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- ReDoc Docs: `http://127.0.0.1:8000/redoc`

---

### 4. Frontend Setup & Startup

Open **Terminal 2 (PowerShell)**:

```powershell
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

- Web Application: `http://localhost:5173`

---

## 🧪 Automated Testing & Verification

### Run Backend Tests (Pytest)
```powershell
backend\.venv\Scripts\python.exe -m pytest
```
*Executes all 20 API integration and unit tests (health, CRUD, rule engine, cleaning, duplicate detection, and ML endpoints).*

### Run Frontend Unit Tests (Vitest)
```powershell
cd frontend
npm run test
```

### Run Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 📊 Microsoft Power BI Desktop Setup

1. In the web application, open **Reports & Power BI** and click **"Generate Power BI CSV Bundle"**.
2. Open **Power BI Desktop**.
3. Click **Get Data > Text/CSV** and select the files from the `reports/` directory:
   - `dashboard_summary.csv`
   - `data_quality_metrics.csv`
   - `duplicate_analysis.csv`
   - `record_analysis_results.csv`
   - `model_metrics.csv`
   - `review_summary.csv`
4. Set model relationships on `record_id`.
5. Refer to [`docs/POWER_BI_SETUP.md`](docs/POWER_BI_SETUP.md) for full DAX measures and visualization formulas.

---

## 🐳 Optional Docker Deployment

To spin up MySQL 8, Backend, and Frontend containers with Docker Compose:

```bash
docker-compose up --build -d
```

---

## 📁 Project Folder Structure

```
fake-name-identity-analytics/
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   |-- endpoints/
|   |   |   |   |-- health.py
|   |   |   |   |-- dashboard.py
|   |   |   |   |-- records.py
|   |   |   |   |-- uploads.py
|   |   |   |   |-- analytics.py
|   |   |   |   |-- models.py
|   |   |   |   |-- reviews.py
|   |   |   |   |-- reports.py
|   |   |   |-- router.py
|   |   |-- core/
|   |   |   |-- config.py
|   |   |   |-- logging.py
|   |   |-- db/
|   |   |   |-- session.py
|   |   |   |-- base.py
|   |   |-- models/
|   |   |   |-- identity.py
|   |   |-- schemas/
|   |   |   |-- identity.py
|   |   |-- services/
|   |   |   |-- cleaner.py
|   |   |   |-- duplicate_detector.py
|   |   |   |-- rule_engine.py
|   |   |-- analytics/
|   |   |   |-- eda.py
|   |   |   |-- exporter.py
|   |   |-- ml/
|   |   |   |-- feature_engineering.py
|   |   |   |-- pipeline.py
|   |   |   |-- model_manager.py
|   |   |-- main.py
|   |-- tests/
|   |   |-- test_api.py
|   |   |-- test_cleaning.py
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- .env.example
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- Badge.tsx
|   |   |   |-- StatCard.tsx
|   |   |   |-- EmptyState.tsx
|   |   |   |-- LoadingSkeleton.tsx
|   |   |   |-- Navbar.tsx
|   |   |   |-- Sidebar.tsx
|   |   |-- layouts/
|   |   |   |-- DashboardLayout.tsx
|   |   |-- pages/
|   |   |   |-- OverviewDashboard.tsx
|   |   |   |-- SingleRecordAnalysis.tsx
|   |   |   |-- BulkCsvUpload.tsx
|   |   |   |-- RecordsExplorer.tsx
|   |   |   |-- DataAnalytics.tsx
|   |   |   |-- MachineLearning.tsx
|   |   |   |-- ReviewQueue.tsx
|   |   |   |-- Reports.tsx
|   |   |   |-- SettingsAbout.tsx
|   |   |-- services/
|   |   |   |-- api.ts
|   |   |-- types/
|   |   |   |-- index.ts
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- index.css
|   |-- package.json
|   |-- vite.config.ts
|   |-- tailwind.config.js
|   |-- Dockerfile
|
|-- scripts/
|   |-- generate_dataset.py
|   |-- seed_database.py
|
|-- data/
|   |-- sample/
|       |-- sample_synthetic_identities.csv
|
|-- sql/
|   |-- views.sql
|
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- API.md
|   |-- POWER_BI_SETUP.md
|   |-- DATASET.md
|
|-- reports/
|-- docker-compose.yml
|-- start_dev.ps1
|-- start_dev.bat
|-- .gitignore
|-- README.md
```

---

## 🔧 Troubleshooting

1. **Port 8000 or 5173 Already in Use**:
   - Check and stop conflicting processes:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
     ```
2. **Database Mode Switching**:
   - By default, the application runs on **SQLite** without requiring any external server.
   - To connect to **MySQL 8.0**, update `DATABASE_URL` in `backend/.env`:
     ```
     DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/synthetic_identity_db
     ```
3. **PowerShell Script Policy**:
   - If `Activate.ps1` gives an execution policy error:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
     ```

---

## 📄 License & Attribution

Developed as a synthetic identity analytics research sandbox and portfolio demonstration system. Open-source under the MIT License.
