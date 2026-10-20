import os
import joblib
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import pandas as pd
from app.core.config import settings
from app.ml.feature_engineering import extract_features_from_record, FEATURE_COLUMNS

class ModelManager:
    _instance = None

    def __init__(self):
        self.supervised_model = None
        self.isolation_model = None
        self.model_version = None
        self.load_latest_models()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_latest_models(self):
        """Loads latest trained model artifacts if present."""
        latest_sup = settings.MODEL_DIR / "latest_model.joblib"
        latest_iso = settings.MODEL_DIR / "latest_isolation_forest.joblib"

        if latest_sup.exists():
            try:
                self.supervised_model = joblib.load(latest_sup)
                self.model_version = "latest"
            except Exception as e:
                self.supervised_model = None
                self.model_version = None

        if latest_iso.exists():
            try:
                self.isolation_model = joblib.load(latest_iso)
            except Exception:
                self.isolation_model = None

    def is_trained(self) -> bool:
        return self.supervised_model is not None

    def predict_record(
        self,
        full_name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        city: Optional[str] = None,
        is_duplicate: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Runs ML prediction for a single record if a trained model is loaded.
        Returns prediction details or None if no model is trained.
        """
        if not self.is_trained():
            return None

        feats = extract_features_from_record(
            full_name=full_name,
            email=email,
            phone=phone,
            city=city,
            is_duplicate=is_duplicate
        )
        df_feat = pd.DataFrame([feats], columns=FEATURE_COLUMNS)

        # Supervised prediction
        prob = None
        pred_label = "NORMAL"
        try:
            proba_arr = self.supervised_model.predict_proba(df_feat)
            prob = float(proba_arr[0][1])
            pred_label = "REVIEW_RECOMMENDED" if prob >= 0.5 else "NORMAL"
        except Exception:
            try:
                raw_pred = self.supervised_model.predict(df_feat)[0]
                pred_label = "REVIEW_RECOMMENDED" if raw_pred == 1 else "NORMAL"
                prob = 1.0 if raw_pred == 1 else 0.0
            except Exception:
                return None

        # Isolation forest anomaly score
        anomaly_detected = False
        anomaly_score = None
        if self.isolation_model is not None:
            try:
                iso_res = self.isolation_model.predict(df_feat)[0]
                anomaly_detected = bool(iso_res == -1)
                anomaly_score = float(self.isolation_model.decision_function(df_feat)[0])
            except Exception:
                pass

        return {
            "model_version": self.model_version or "latest",
            "prediction": pred_label,
            "probability": prob,
            "anomaly_detected": anomaly_detected,
            "anomaly_score": anomaly_score,
            "disclaimer": (
                "Synthetic Demonstration Model: Risk probabilities reflect synthetic training patterns, "
                "not confirmed real-world fraud identity verification."
            )
        }

model_manager = ModelManager.get_instance()
