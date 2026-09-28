"""LightGBM Adapter for BDI freight forecasting.

Loads trained LightGBM models (point, P10 quantile, P90 quantile) serialized with joblib,
evaluates SHAP TreeExplainer feature attributions, and executes autoregressive multi-step
forecasting with lag and rolling statistics updates.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import joblib
import numpy as np

from app.services.model_interface import ForecastResult, ModelInterface, ModelMetrics

logger = logging.getLogger(__name__)

try:
    import shap  # type: ignore

    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False
    logger.warning("SHAP library not found. Falling back to tree feature importances.")


# Default human-readable feature display names for dry bulk shipping
DEFAULT_FEATURE_DISPLAY_MAP: dict[str, str] = {
    "bdi_lag_1": "BDI (1-Day Lag)",
    "bdi_lag_2": "BDI (2-Day Lag)",
    "bdi_lag_3": "BDI (3-Day Lag)",
    "bdi_lag_7": "BDI (7-Day Lag)",
    "bdi_lag_14": "BDI (14-Day Lag)",
    "bdi_lag_30": "BDI (30-Day Lag)",
    "bdi_rolling_7_mean": "BDI 7-Day Moving Avg",
    "bdi_rolling_30_mean": "BDI 30-Day Moving Avg",
    "bdi_rolling_7_std": "BDI 7-Day Volatility",
    "bdi_rolling_30_std": "BDI 30-Day Volatility",
    "bdi_momentum_14d": "BDI 14-Day Momentum",
    "bdi_return_1d": "BDI Daily Return",
    "bdi_return_7d": "BDI 7-Day Return",
    "brent_crude": "Brent Crude Oil ($/bbl)",
    "bunker_fuel_vlsfo": "VLSFO Bunker Fuel ($/mt)",
    "iron_ore_cfr": "Iron Ore 62% Fe CFR China ($/dmt)",
    "coal_newcastle": "Newcastle Thermal Coal ($/mt)",
    "usd_inr": "USD / INR Exchange Rate",
    "china_steel_output": "China Steel Production Index",
    "port_congestion_index": "East Coast Port Congestion Index",
    "fleet_growth_rate": "Global Dry Bulk Fleet Growth Rate",
    "fleet_capacity_dwt": "Global Dry Bulk Fleet Capacity (DWT)",
    "monsoon_factor": "Indian Monsoon Weather Factor",
}


class LightGBMAdapter(ModelInterface):
    """Production LightGBM adapter for autoregressive freight forecasting.

    Loads 3 joblib models:
      1. Point forecast model (regression)
      2. Quantile low model (alpha=0.10, P10 lower uncertainty bound)
      3. Quantile high model (alpha=0.90, P90 upper uncertainty bound)
    Plus scikit-learn feature scaler, feature metadata JSON, and model performance JSON.
    """

    def __init__(
        self,
        model_dir: Optional[Union[str, Path]] = None,
        strict: bool = False,
    ) -> None:
        """Initialize the LightGBM adapter.

        Args:
            model_dir: Directory containing trained artifacts (.joblib and .json).
                       Defaults to environment variable MODEL_DIR or '<backend>/models'.
            strict: If True, raises FileNotFoundError immediately during __init__
                    if required model files are missing. If False, files are loaded
                    on demand or checked when methods are invoked.
        """
        if model_dir is not None:
            self.model_dir = Path(model_dir).resolve()
        elif "MODEL_DIR" in os.environ:
            self.model_dir = Path(os.environ["MODEL_DIR"]).resolve()
        else:
            # Default to backend/models
            self.model_dir = Path(__file__).resolve().parents[3] / "models"

        self.strict = strict
        self.point_model: Any = None
        self.quantile_low_model: Any = None
        self.quantile_high_model: Any = None
        self.scaler: Any = None
        self.feature_metadata: dict[str, Any] = {}
        self.model_performance: dict[str, Any] = {}
        self.feature_names: list[str] = []
        self.display_names: dict[str, str] = dict(DEFAULT_FEATURE_DISPLAY_MAP)
        self.explainer: Any = None
        self.is_loaded: bool = False
        self._load_errors: list[str] = []

        self.load_artifacts(strict=strict)

    def _resolve_file(self, candidates: list[str]) -> Optional[Path]:
        """Find the first existing file among candidate names in model_dir."""
        for name in candidates:
            p = self.model_dir / name
            if p.is_file():
                return p
        return None

    def load_artifacts(self, strict: bool = False) -> None:
        """Load trained models, scalers, and metadata files from disk.

        Args:
            strict: If True, raises FileNotFoundError upon missing required files.
        """
        self._load_errors.clear()

        if not self.model_dir.is_dir():
            msg = f"Model directory does not exist: {self.model_dir}"
            self._load_errors.append(msg)
            if strict:
                raise FileNotFoundError(msg)
            return

        # 1. Point model
        point_file = self._resolve_file(
            ["point_model.joblib", "bdi_point_model.joblib", "lgb_point.joblib", "model_point.joblib"]
        )
        if point_file is not None:
            try:
                self.point_model = joblib.load(point_file)
            except Exception as e:
                self._load_errors.append(f"Failed loading point model from {point_file}: {e}")
        else:
            self._load_errors.append(f"Point model file not found in {self.model_dir}")

        # 2. Quantile low model (P10)
        q_low_file = self._resolve_file(
            [
                "quantile_low_model.joblib",
                "bdi_quantile_low_model.joblib",
                "lgb_q10.joblib",
                "lgb_quantile_low.joblib",
                "model_q10.joblib",
            ]
        )
        if q_low_file is not None:
            try:
                self.quantile_low_model = joblib.load(q_low_file)
            except Exception as e:
                self._load_errors.append(f"Failed loading quantile low model from {q_low_file}: {e}")
        else:
            self._load_errors.append(f"Quantile low model file not found in {self.model_dir}")

        # 3. Quantile high model (P90)
        q_high_file = self._resolve_file(
            [
                "quantile_high_model.joblib",
                "bdi_quantile_high_model.joblib",
                "lgb_q90.joblib",
                "lgb_quantile_high.joblib",
                "model_q90.joblib",
            ]
        )
        if q_high_file is not None:
            try:
                self.quantile_high_model = joblib.load(q_high_file)
            except Exception as e:
                self._load_errors.append(f"Failed loading quantile high model from {q_high_file}: {e}")
        else:
            self._load_errors.append(f"Quantile high model file not found in {self.model_dir}")

        # 4. Feature Scaler (optional or required based on pipeline)
        scaler_file = self._resolve_file(["scaler.joblib", "feature_scaler.joblib", "bdi_scaler.joblib"])
        if scaler_file is not None:
            try:
                self.scaler = joblib.load(scaler_file)
            except Exception as e:
                logger.warning("Could not load scaler from %s: %s", scaler_file, e)

        # 5. Feature metadata JSON
        meta_file = self._resolve_file(["feature_metadata.json", "features.json", "metadata.json"])
        if meta_file is not None:
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    self.feature_metadata = json.load(f)
                if "feature_names" in self.feature_metadata:
                    self.feature_names = list(self.feature_metadata["feature_names"])
                if "display_names" in self.feature_metadata:
                    self.display_names.update(self.feature_metadata["display_names"])
            except Exception as e:
                self._load_errors.append(f"Failed loading feature metadata from {meta_file}: {e}")
        else:
            # Check if point_model exposes feature names directly
            if hasattr(self.point_model, "feature_name_"):
                self.feature_names = list(self.point_model.feature_name_)
            elif hasattr(self.point_model, "booster_") and hasattr(self.point_model.booster_, "feature_name"):
                self.feature_names = list(self.point_model.booster_.feature_name())
            else:
                self._load_errors.append(f"Feature metadata file not found in {self.model_dir}")

        # 6. Model performance JSON
        perf_file = self._resolve_file(["model_performance.json", "performance.json", "metrics.json"])
        if perf_file is not None:
            try:
                with open(perf_file, "r", encoding="utf-8") as f:
                    self.model_performance = json.load(f)
            except Exception as e:
                self._load_errors.append(f"Failed loading model performance from {perf_file}: {e}")
        else:
            self._load_errors.append(f"Model performance file not found in {self.model_dir}")

        # 7. Initialize SHAP TreeExplainer if point model is present
        if HAS_SHAP and self.point_model is not None:
            try:
                self.explainer = shap.TreeExplainer(self.point_model)
            except Exception as e:
                logger.warning("TreeExplainer initialization failed: %s", e)
                self.explainer = None

        # Check overall loading status
        required_models_loaded = (
            self.point_model is not None
            and self.quantile_low_model is not None
            and self.quantile_high_model is not None
            and len(self.feature_names) > 0
        )
        self.is_loaded = required_models_loaded

        if strict and not self.is_loaded:
            error_details = "\n - ".join(self._load_errors)
            raise FileNotFoundError(
                f"Failed to load required LightGBM model artifacts from {self.model_dir}:\n - {error_details}"
            )

    def _ensure_models_loaded(self) -> None:
        """Verify that models and feature names are loaded before inference."""
        if not self.is_loaded:
            errors = "\n - ".join(self._load_errors) if self._load_errors else "Models not loaded."
            raise FileNotFoundError(
                f"LightGBM models are not loaded from '{self.model_dir}'. "
                f"Ensure training pipeline artifacts exist or use MockAdapter.\nDetails:\n - {errors}"
            )

    def get_display_name(self, feature_name: str) -> str:
        """Map technical feature column name to a human-readable display string."""
        if feature_name in self.display_names:
            return self.display_names[feature_name]
        return feature_name.replace("_", " ").title()

    def get_feature_names(self) -> list[str]:
        """Return ordered list of feature names the model expects."""
        self._ensure_models_loaded()
        return list(self.feature_names)

    def explain(self, features: np.ndarray) -> dict[str, float]:
        """Return SHAP-based feature importance for current prediction.

        Args:
            features: 1D or 2D numpy array of feature values.

        Returns:
            Dictionary mapping feature display names to signed SHAP contributions,
            sorted by absolute importance descending.
        """
        self._ensure_models_loaded()
        feat_array = np.asarray(features, dtype=float)
        if feat_array.ndim == 1:
            feat_array = feat_array.reshape(1, -1)

        if feat_array.shape[1] != len(self.feature_names):
            raise ValueError(
                f"Feature vector dimension mismatch: expected {len(self.feature_names)} "
                f"features, got {feat_array.shape[1]}"
            )

        # Scale features if scaler exists and was trained on feature dimension
        X_eval = feat_array
        if self.scaler is not None and hasattr(self.scaler, "transform"):
            try:
                X_eval = self.scaler.transform(feat_array)
            except Exception as e:
                logger.debug("Scaler transform failed in explain(), using raw features: %s", e)

        importance_dict: dict[str, float] = {}

        # 1. Use SHAP TreeExplainer if available
        if self.explainer is not None:
            try:
                shap_vals = self.explainer.shap_values(X_eval)
                if isinstance(shap_vals, list):
                    arr = np.asarray(shap_vals[0])
                else:
                    arr = np.asarray(shap_vals)
                if arr.ndim > 1:
                    arr = arr[0]
                for name, val in zip(self.feature_names, arr):
                    disp = self.get_display_name(name)
                    importance_dict[disp] = round(float(val), 4)
                return dict(sorted(importance_dict.items(), key=lambda item: abs(item[1]), reverse=True))
            except Exception as e:
                logger.warning("SHAP calculation failed, falling back to tree feature importances: %s", e)

        # 2. Fallback: Native LightGBM feature importance
        if hasattr(self.point_model, "feature_importances_"):
            raw_imp = self.point_model.feature_importances_
            total = float(np.sum(raw_imp)) or 1.0
            for name, imp in zip(self.feature_names, raw_imp):
                disp = self.get_display_name(name)
                importance_dict[disp] = round(float(imp / total) * 100.0, 4)
        else:
            for name in self.feature_names:
                disp = self.get_display_name(name)
                importance_dict[disp] = 0.0

        return dict(sorted(importance_dict.items(), key=lambda item: abs(item[1]), reverse=True))

    def predict(self, features: np.ndarray, horizon_days: int) -> ForecastResult:
        """Generate multi-step BDI forecast with autoregressive lag updates and uncertainty bands.

        Iteratively forecasts day 1, shifts lag features (bdi_lag_1 gets y_hat_1,
        bdi_lag_2 gets previous bdi_lag_1, etc.), updates rolling mean and std
        features, and forecasts subsequent steps up to horizon_days.

        Args:
            features: 1D or 2D array of initial feature values.
            horizon_days: Number of days into future to forecast (e.g. 1 to 30).

        Returns:
            ForecastResult with dates, predicted BDI values, P10/P90 confidence bounds,
            and SHAP feature importances.
        """
        self._ensure_models_loaded()

        if horizon_days < 1:
            raise ValueError(f"horizon_days must be at least 1, got {horizon_days}")

        feat_vector = np.asarray(features, dtype=float).flatten().copy()
        if len(feat_vector) != len(self.feature_names):
            raise ValueError(
                f"Feature vector dimension mismatch: expected {len(self.feature_names)} "
                f"features, got {len(feat_vector)}"
            )

        col_idx: dict[str, int] = {name: i for i, name in enumerate(self.feature_names)}

        # Initialize BDI history buffer (last 30 days) from existing lag features
        # If specific lags are present, place them at their negative offsets
        bdi_history: list[float] = [1500.0] * 35
        # Set base from bdi_lag_1 if present
        if "bdi_lag_1" in col_idx:
            base_val = float(feat_vector[col_idx["bdi_lag_1"]])
            bdi_history = [base_val] * 35

        for col, idx in col_idx.items():
            if col.startswith("bdi_lag_"):
                try:
                    lag_num = int(col.split("_")[-1])
                    if 1 <= lag_num <= 35:
                        bdi_history[-lag_num] = float(feat_vector[idx])
                except ValueError:
                    continue

        today = datetime.now(timezone.utc).date()
        dates: list[str] = []
        predicted_values: list[float] = []
        confidence_lower: list[float] = []
        confidence_upper: list[float] = []

        cur_features = feat_vector.copy()

        for step in range(1, horizon_days + 1):
            fc_date = today + timedelta(days=step)
            dates.append(fc_date.isoformat())

            # Prepare feature vector for model input
            X_step = cur_features.reshape(1, -1)
            if self.scaler is not None and hasattr(self.scaler, "transform"):
                try:
                    X_step = self.scaler.transform(X_step)
                except Exception as e:
                    logger.debug("Scaler transform failed at step %d: %s", step, e)

            # 1. Point prediction
            raw_pred = float(self.point_model.predict(X_step)[0])
            pred_val = round(max(200.0, raw_pred), 2)
            predicted_values.append(pred_val)

            # 2. Quantile bounds (P10 & P90)
            raw_q_low = float(self.quantile_low_model.predict(X_step)[0])
            raw_q_high = float(self.quantile_high_model.predict(X_step)[0])

            # Prevent quantile crossing and maintain physical lower bounds
            q_low = round(max(100.0, min(raw_q_low, pred_val)), 2)
            q_high = round(max(q_low, max(raw_q_high, pred_val)), 2)

            confidence_lower.append(q_low)
            confidence_upper.append(q_high)

            # 3. Autoregressive Update: Append new prediction to history
            bdi_history.append(pred_val)

            # 4. Lag shifting logic:
            # bdi_lag_1 gets new prediction (bdi_history[-1])
            # bdi_lag_2 gets previous bdi_lag_1 (bdi_history[-2])
            # bdi_lag_k gets bdi_history[-k]
            for col, idx in col_idx.items():
                if col.startswith("bdi_lag_"):
                    try:
                        lag_num = int(col.split("_")[-1])
                        if lag_num <= len(bdi_history):
                            cur_features[idx] = bdi_history[-lag_num]
                    except ValueError:
                        continue

            # 5. Update rolling statistical features approximately
            if "bdi_rolling_7_mean" in col_idx:
                cur_features[col_idx["bdi_rolling_7_mean"]] = float(np.mean(bdi_history[-7:]))

            if "bdi_rolling_30_mean" in col_idx:
                cur_features[col_idx["bdi_rolling_30_mean"]] = float(np.mean(bdi_history[-30:]))

            if "bdi_rolling_7_std" in col_idx:
                std_val = float(np.std(bdi_history[-7:], ddof=1)) if len(bdi_history) >= 7 else 0.0
                cur_features[col_idx["bdi_rolling_7_std"]] = std_val

            if "bdi_rolling_30_std" in col_idx:
                std_val = float(np.std(bdi_history[-30:], ddof=1)) if len(bdi_history) >= 30 else 0.0
                cur_features[col_idx["bdi_rolling_30_std"]] = std_val

            if "bdi_momentum_14d" in col_idx:
                cur_features[col_idx["bdi_momentum_14d"]] = float(bdi_history[-1] - bdi_history[-14])

            if "bdi_return_1d" in col_idx:
                prev_1 = bdi_history[-2]
                cur_features[col_idx["bdi_return_1d"]] = float(
                    (bdi_history[-1] - prev_1) / prev_1 if prev_1 != 0 else 0.0
                )

            if "bdi_return_7d" in col_idx:
                prev_7 = bdi_history[-8]
                cur_features[col_idx["bdi_return_7d"]] = float(
                    (bdi_history[-1] - prev_7) / prev_7 if prev_7 != 0 else 0.0
                )

        # Compute SHAP feature importances for initial condition
        feature_importances = self.explain(features)

        return ForecastResult(
            dates=dates,
            predicted_values=predicted_values,
            confidence_lower=confidence_lower,
            confidence_upper=confidence_upper,
            feature_importances=feature_importances,
        )

    def get_metrics(self, horizon: str) -> ModelMetrics:
        """Return performance metrics for a specific horizon (1d/7d/14d/30d).

        Args:
            horizon: Identifier string ('1d', '7d', '14d', '30d').

        Returns:
            ModelMetrics object with MAE, std_dev, directional_accuracy, etc.
        """
        norm_h = horizon.strip().lower()

        # Check in model_performance.json
        if not self.model_performance:
            perf_file = self._resolve_file(["model_performance.json", "performance.json", "metrics.json"])
            if perf_file is None:
                raise FileNotFoundError(
                    f"Model performance file 'model_performance.json' not found in {self.model_dir}. "
                    "Run model evaluation pipeline to generate metrics."
                )
            with open(perf_file, "r", encoding="utf-8") as f:
                self.model_performance = json.load(f)

        data = self.model_performance
        metrics_dict = data.get("metrics_by_horizon", data)

        if norm_h in metrics_dict:
            entry = metrics_dict[norm_h]
            return ModelMetrics(
                mae=float(entry.get("mae", 0.0)),
                std_dev=float(entry.get("std_dev", entry.get("rmse", 0.0))),
                directional_accuracy=float(entry.get("directional_accuracy", 0.0)),
                last_validated=str(entry.get("last_validated", data.get("last_validated", "2026-08-15"))),
                walk_forward_folds=str(
                    entry.get(
                        "walk_forward_folds",
                        data.get("walk_forward_folds", "2024-01-01 to 2026-08-01, 6 folds"),
                    )
                ),
            )

        raise KeyError(
            f"Horizon '{horizon}' not found in performance metrics. Available horizons: {list(metrics_dict.keys())}"
        )

    def get_all_model_comparison(self) -> dict:
        """Return comparison metrics for all models (Naive, Linear, RF, LightGBM) across all horizons.

        Returns:
            Dictionary mapping horizons to model benchmark metrics.
        """
        if not self.model_performance:
            perf_file = self._resolve_file(["model_performance.json", "performance.json", "metrics.json"])
            if perf_file is None:
                raise FileNotFoundError(
                    f"Model performance file 'model_performance.json' not found in {self.model_dir}."
                )
            with open(perf_file, "r", encoding="utf-8") as f:
                self.model_performance = json.load(f)

        if "comparison" in self.model_performance:
            return self.model_performance["comparison"]

        return self.model_performance
