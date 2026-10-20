# Architecture Specification

## Fake Name & Synthetic Identity Analytics System

### 1. High-Level System Architecture

The **Fake Name & Synthetic Identity Analytics System** is designed with a defense-in-depth, multi-tiered architecture that decouples frontend user interactions from analytical computation, machine learning pipelines, and relational database persistence.

```
+-------------------------------------------------------------------------+
|                           CLIENT TIER (React 18 + Vite)                |
|  - Dashboard      - Single Analysis  - Bulk CSV Ingest  - Records Table |
|  - Analytics EDA  - ML Management    - Review Queue     - Reports / BI  |
+------------------------------------+------------------------------------+
                                     | REST JSON / Form-Data (Axios)
                                     v
+------------------------------------+------------------------------------+
|                         BACKEND TIER (FastAPI)                          |
|  - Auth/CORS/Logging               - Request Validation (Pydantic v2)   |
|  - Rule Signal Evaluation Engine   - Duplicate Clustered Matching       |
|  - Feature Engineering Extractor   - Model Inference (Scikit-Learn)     |
|  - Power BI & Report Exporter      - Database Session Lifecycle         |
+------------------------------------+------------------------------------+
                                     | SQLAlchemy 2.0 ORM
                                     v
+------------------------------------+------------------------------------+
|                         PERSISTENCE TIER                                |
|  - Default: SQLite 3 (Zero setup local dev, thread-safe session pool)   |
|  - Enterprise: MySQL 8.0+ (Production connection pooling)               |
|  - Serialized Artifacts: Joblib (Random Forest, Isolation Forest)       |
+-------------------------------------------------------------------------+
```

---

### 2. Analytical & Detection Flow

1. **Ingestion & Normalization**:
   - Records enter via single-record entry or streaming CSV bulk upload.
   - Names, emails, and phones undergo unicode normalization (NFKC), lowercase standardization, whitespace trimming, and non-destructive cleaning while preserving raw inputs.
2. **Duplicate & Cluster Detection**:
   - Compares composite keys (`normalized_name + email`, `normalized_name + phone`, or `phone alone`).
   - Clusters linked records into assigned group IDs (`GRP-XXXX`).
3. **Deterministic Heuristic Rule Engine**:
   - Evaluates syntax compliance, character patterns (digits in names, invalid punctuation, repetitive sequences), placeholder phrase matches (`test`, `asdf`, `admin`), and disposable email domains.
   - Emits structured `RuleSignal` objects (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
4. **Machine Learning Pipeline**:
   - Extracts 16 numerical features from records (character counts, token counts, whitespace anomaly flags, placeholder flags, contact completeness).
   - Supervised classification: Compares **Logistic Regression (Balanced)** and **Random Forest Classifier (100 Trees)**.
   - Unsupervised anomaly detection: Runs **Isolation Forest** to measure multidimensional spatial distance.
5. **Human-in-the-Loop Review Queue**:
   - Flagged profiles are placed in a persistent review queue.
   - Analysts adjudicate outcomes (`APPROVED`, `CONFIRMED_ISSUE`, `FALSE_POSITIVE`, `DISMISSED`) with audit notes.

---

### 3. Ethical Safeguards & Cultural Diversity

- **No Defamatory Fraud Accusations**: All results are reported as *Analytical Signals* or *Review Recommendations*.
- **Multicultural Inclusivity**: Short names (e.g. Bo Li), hyphenated names (e.g. Jean-Luc), apostrophes (e.g. O'Connor), and diverse non-English phonetics are not penalized.
- **No Protected Attributes**: The system strictly avoids race, religion, ethnicity, gender, caste, or nationality in all scoring logic.
