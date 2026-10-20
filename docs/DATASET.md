# Synthetic Dataset Documentation & Data Dictionary

## 1. Generation Methodology

The dataset used in this platform is generated via `scripts/generate_dataset.py` using Python's `Faker` library combined with controlled perturbation algorithms to produce realistic identity distributions with known anomaly classes.

### Seed & Reproducibility
- **Random Seed**: `42`
- **Faker Seed**: `42`
- **Locales Used**: `['en_US', 'en_GB', 'es_ES', 'fr_FR', 'de_DE']` for diverse multi-cultural representation.
- **Total Records**: ~10,300 rows (including 300 controlled duplicate cluster pairs).
- **Sample Distribution**: A 500-row sample is located at `data/sample/sample_synthetic_identities.csv`.

---

## 2. Data Dictionary

| Column Name | Data Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `record_id` | String | Unique synthetic identifier | `SYN-7A9B1C2D3E` |
| `full_name` | String | Fictional identity name | `Elena Rostova` |
| `email` | String (Nullable) | Synthetic or disposable email address | `elena.rostova42@gmail.com` |
| `phone` | String (Nullable) | Fictional phone number | `+1-202-555-0184` |
| `city` | String (Nullable) | Fictional city location | `Seattle` |
| `date_created` | ISO Date | Synthetic account registration date | `2026-03-15` |
| `synthetic_label` | Integer | Synthetic research label (0 = Normal, 1 = Irregular) | `0` |

---

## 3. Synthetic Label Rules & Leakage Prevention

Labels are assigned according to predefined heuristic rules to benchmark classifier learning:
- **Label 0 (Plausible / Normal)**: Natural names across diverse linguistic conventions, valid email syntax on commercial providers, plausible phone numbers.
- **Label 1 (Artificial / Irregular)**:
  - Known placeholder names (`Test User`, `Demo`, `Asdf Asdf`, `Admin`).
  - Digits embedded into name fields (`John99`, `Mary123`).
  - Special punctuation characters (`Mary#Smith`, `Bob$`).
  - Known test/disposable email domains (`mailinator.com`, `tempmail.com`, `example.com`).
  - Repeated single-digit phone numbers (`0000000000`, `9999999999`).
  - Sequential ascending/descending phone patterns (`1234567890`).

### Leakage Prevention
The generation rules and machine learning feature extraction are decoupled:
- The classifier does not receive the generation rule name or the artificial generator flag.
- The model extracts 16 independent quantitative features (e.g., character length, whitespace irregularity, digit counts, contact completeness, duplicate flags).
- Stratified train/test splits ensure that duplicate cluster pairs do not bias evaluation results.

---

## 4. Dataset Limitations & Real-World Disclaimer

> [!WARNING]
> **Synthetic Demonstration Limitation**:
> 1. High accuracy or F1-scores on synthetic data **do not** prove production-grade fraud detection capability against real human adversaries.
> 2. Real-world fraud often utilizes stolen, valid credentials (identity theft) rather than simple synthetic keyboard mashing.
> 3. This dataset is engineered for academic demonstrations, portfolio evaluation, and data quality pipeline validation.
