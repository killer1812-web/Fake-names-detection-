import os
import joblib
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from app.ml.feature_engineering import FEATURE_COLUMNS, build_feature_dataframe
from app.core.config import settings

def train_and_evaluate_models(
    records_with_labels: List[Dict[str, Any]],
    test_size: float = 0.2,
    random_seed: int = 42
) -> Dict[str, Any]:
    """
    Trains and compares Logistic Regression, Random Forest, and Isolation Forest.
    Returns comprehensive evaluation metrics and serializable model artifacts.
    """
    # 1. Validation of training dataset
    valid_samples = [r for r in records_with_labels if r.get("synthetic_label") is not None]
    if len(valid_samples) < 50:
        raise ValueError(
            f"Insufficient labeled training data: found {len(valid_samples)} labeled records. "
            "A minimum of 50 labeled synthetic examples is required to train reliable classifiers."
        )

    # 2. Extract features and target
    df_features = build_feature_dataframe(valid_samples)
    y = np.array([int(r["synthetic_label"]) for r in valid_samples])

    # Check class distribution
    unique, counts = np.unique(y, return_counts=True)
    class_dist = dict(zip([int(u) for u in unique], [int(c) for c in counts]))
    if len(unique) < 2:
        raise ValueError("Training dataset must contain at least two target classes (0 and 1).")

    # 3. Stratified Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        df_features, y, test_size=test_size, random_state=random_seed, stratify=y
    )

    results = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "total_samples": len(valid_samples),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "class_distribution": class_dist,
        "feature_names": FEATURE_COLUMNS,
        "models": {}
    }

    # 4. Train Logistic Regression
    lr_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(class_weight="balanced", random_state=random_seed, max_iter=1000))
    ])
    lr_pipeline.fit(X_train, y_train)
    y_pred_lr = lr_pipeline.predict(X_test)
    y_prob_lr = lr_pipeline.predict_proba(X_test)[:, 1]

    cm_lr = confusion_matrix(y_test, y_pred_lr).tolist()
    results["models"]["logistic_regression"] = {
        "model_name": "Logistic Regression (Balanced)",
        "accuracy": float(accuracy_score(y_test, y_pred_lr)),
        "precision": float(precision_score(y_test, y_pred_lr, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred_lr, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred_lr, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_lr)) if len(np.unique(y_test)) > 1 else None,
        "confusion_matrix": cm_lr,
        "false_positives": int(cm_lr[0][1]) if len(cm_lr) > 1 else 0,
        "false_negatives": int(cm_lr[1][0]) if len(cm_lr) > 1 else 0,
        "coefficients": dict(zip(FEATURE_COLUMNS, [float(c) for c in lr_pipeline.named_steps["classifier"].coef_[0]]))
    }

    # 5. Train Random Forest
    rf_pipeline = Pipeline([
        ("classifier", RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=random_seed, max_depth=10))
    ])
    rf_pipeline.fit(X_train, y_train)
    y_pred_rf = rf_pipeline.predict(X_test)
    y_prob_rf = rf_pipeline.predict_proba(X_test)[:, 1]

    cm_rf = confusion_matrix(y_test, y_pred_rf).tolist()
    rf_feat_imp = dict(zip(FEATURE_COLUMNS, [float(imp) for imp in rf_pipeline.named_steps["classifier"].feature_importances_]))
    results["models"]["random_forest"] = {
        "model_name": "Random Forest Classifier",
        "accuracy": float(accuracy_score(y_test, y_pred_rf)),
        "precision": float(precision_score(y_test, y_pred_rf, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred_rf, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred_rf, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_rf)) if len(np.unique(y_test)) > 1 else None,
        "confusion_matrix": cm_rf,
        "false_positives": int(cm_rf[0][1]) if len(cm_rf) > 1 else 0,
        "false_negatives": int(cm_rf[1][0]) if len(cm_rf) > 1 else 0,
        "feature_importances": rf_feat_imp
    }

    # 6. Train Isolation Forest (Unsupervised Anomaly Detection)
    iso_forest = IsolationForest(contamination=0.15, random_state=random_seed)
    iso_forest.fit(df_features)
    # -1 is anomaly, 1 is normal -> map -1 to 1 (flagged) and 1 to 0 (normal)
    iso_preds = [1 if p == -1 else 0 for p in iso_forest.predict(df_features)]
    iso_cm = confusion_matrix(y, iso_preds).tolist()
    results["models"]["isolation_forest"] = {
        "model_name": "Isolation Forest (Unsupervised Anomaly Detector)",
        "accuracy": float(accuracy_score(y, iso_preds)),
        "precision": float(precision_score(y, iso_preds, zero_division=0)),
        "recall": float(recall_score(y, iso_preds, zero_division=0)),
        "f1_score": float(f1_score(y, iso_preds, zero_division=0)),
        "confusion_matrix": iso_cm,
        "false_positives": int(iso_cm[0][1]) if len(iso_cm) > 1 else 0,
        "false_negatives": int(iso_cm[1][0]) if len(iso_cm) > 1 else 0,
        "note": "Unsupervised anomaly detector measuring dimensional outliers, independent of supervised ground truth."
    }

    # Pick the best supervised model (higher F1)
    best_key = "random_forest" if results["models"]["random_forest"]["f1_score"] >= results["models"]["logistic_regression"]["f1_score"] else "logistic_regression"
    best_pipeline = rf_pipeline if best_key == "random_forest" else lr_pipeline
    results["selected_best_model"] = best_key

    # Save artifacts
    version_tag = f"v{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    model_path = settings.MODEL_DIR / f"best_model_{version_tag}.joblib"
    iso_path = settings.MODEL_DIR / f"isolation_forest_{version_tag}.joblib"
    meta_path = settings.MODEL_DIR / f"metadata_{version_tag}.json"

    joblib.dump(best_pipeline, model_path)
    joblib.dump(iso_forest, iso_path)

    # Save latest pointers
    joblib.dump(best_pipeline, settings.MODEL_DIR / "latest_model.joblib")
    joblib.dump(iso_forest, settings.MODEL_DIR / "latest_isolation_forest.joblib")

    results["model_version"] = version_tag
    results["artifact_path"] = str(model_path)

    return results
