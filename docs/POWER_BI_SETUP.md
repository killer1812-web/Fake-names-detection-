# Microsoft Power BI Integration Guide

This guide walks you through importing, modeling, and visualizing the **Fake Name & Synthetic Identity Analytics System** datasets in **Microsoft Power BI Desktop**.

---

## 1. Exporting the Datasets

You can generate the standardized CSV bundle in two ways:

1. **Via UI**: Navigate to the **Reports & Power BI** page in the web app and click **"Generate Power BI CSV Bundle"**.
2. **Via Backend API**: Send a POST request to `http://127.0.0.1:8000/api/reports/generate-power-bi`.

This creates 6 normalized CSV files in the project's `reports/` directory:
- `dashboard_summary.csv`: Overall platform KPIs and high-level health metrics.
- `data_quality_metrics.csv`: Data quality counts, percentages, and pre/post-cleaning stages.
- `duplicate_analysis.csv`: Clustered duplicate profiles with group IDs.
- `record_analysis_results.csv`: Detailed records table with predictions, validation statuses, and probabilities.
- `model_metrics.csv`: Machine learning performance scores (Accuracy, Precision, Recall, F1, ROC-AUC).
- `review_summary.csv`: Human review queue outcomes and audit logs.

---

## 2. Importing into Power BI Desktop

1. Open **Microsoft Power BI Desktop**.
2. In the **Home** ribbon, click **Get Data** > **Text/CSV**.
3. Browse to the workspace directory:
   ```
   c:\Users\divakar v\OneDrive\Desktop\desktop\Fake name detection\reports\
   ```
4. Load each of the 6 CSV files into Power BI:
   - Select the file, verify the preview displays columns correctly with UTF-8 encoding, and click **Load**.
   - Repeat for all 6 files.

---

## 3. Configuring Data Relationships

1. Switch to the **Model View** (icon on the left navigation bar).
2. Establish the following primary relationships:
   - **`record_analysis_results` (record_id)** 1-to-Many `duplicate_analysis` (record_id)
   - **`record_analysis_results` (record_id)** 1-to-1 or 1-to-Many `review_summary` (record_id)
3. Set cross-filter direction to **Both** where appropriate for drill-through slicing.

---

## 4. Key DAX Measures

Create a new table for measures or add them directly to `record_analysis_results`:

### Pass Rate Percentage:
```dax
Quality Pass Rate = 
DIVIDE(
    CALCULATE(COUNTROWS('record_analysis_results'), 'record_analysis_results'[validation_status] = "VALID"),
    COUNTROWS('record_analysis_results'),
    0
) * 100
```

### Flagged Records Count:
```dax
Flagged Records = 
CALCULATE(
    COUNTROWS('record_analysis_results'),
    'record_analysis_results'[validation_status] IN {"FLAGGED", "INVALID_FORMAT"}
)
```

### Duplicate Rate:
```dax
Duplicate Rate = 
DIVIDE(
    CALCULATE(COUNTROWS('record_analysis_results'), 'record_analysis_results'[is_duplicate] = TRUE()),
    COUNTROWS('record_analysis_results'),
    0
) * 100
```

---

## 5. Visualizations to Build

### A. Executive KPI Cards
- Add **Card** visuals from `dashboard_summary.csv` or using DAX measures for:
  - Total Analyzed Records
  - Quality Pass Rate (%)
  - Flagged for Review
  - Duplicate Clusters

### B. Time-Series Trends
- Visual: **Area Chart** or **Line Chart**
- X-Axis: `record_analysis_results[created_at]` (Hierarchy: Month / Day)
- Y-Axis: Count of `record_id`
- Legend: `record_analysis_results[validation_status]`

### C. Duplicate Cluster Decomposition Tree
- Visual: **Decomposition Tree**
- Analyze: Count of `record_id`
- Explain By: `duplicate_group_id`, `full_name`, `email`

### D. Model Evaluation Matrix
- Visual: **Matrix** or **Clustered Bar Chart**
- Rows: `model_metrics[model_name]`
- Values: `F1-Score`, `Precision`, `Recall`, `Accuracy`

---

## 6. Refreshing Data

Whenever new datasets are uploaded or additional reviews are submitted in the web application:
1. Click **"Generate Power BI CSV Bundle"** in the web app or trigger the API endpoint.
2. In Power BI Desktop, click the **Refresh** button on the Home ribbon.
3. All charts, DAX measures, and relationships will update automatically.
