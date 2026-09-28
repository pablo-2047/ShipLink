"""Abstract Model Interface for Baltic Dry Index (BDI) freight rate forecasting.

Defines standard output schemas and the abstract contract between the backend
platform and machine learning model implementations.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List
import numpy as np


@dataclass
class ForecastResult:
    """Standard output from any forecast model.

    Attributes:
        dates: List of ISO date strings for the forecast period (e.g., ["2026-09-10", ...]).
        predicted_values: Point forecasts for Baltic Dry Index (BDI).
        confidence_lower: 10th percentile confidence bounds (P10).
        confidence_upper: 90th percentile confidence bounds (P90).
        feature_importances: Mapping from feature name to SHAP value or importance score.
    """

    dates: list[str]
    predicted_values: list[float]
    confidence_lower: list[float]
    confidence_upper: list[float]
    feature_importances: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert forecast result to serializable dictionary."""
        return {
            "dates": self.dates,
            "predicted_values": self.predicted_values,
            "confidence_lower": self.confidence_lower,
            "confidence_upper": self.confidence_upper,
            "feature_importances": self.feature_importances,
        }


@dataclass
class ModelMetrics:
    """Performance metrics for the model trust panel.

    Attributes:
        mae: Mean Absolute Error on out-of-sample evaluation data.
        std_dev: Standard deviation of forecast residuals.
        directional_accuracy: Percentage of days the forecast direction was correct (0.0 to 1.0 or 0 to 100).
        last_validated: ISO date string of last validation run.
        walk_forward_folds: Description of backtest folds (e.g., '2024-01-01 to 2026-08-01, 6 folds').
    """

    mae: float
    std_dev: float
    directional_accuracy: float
    last_validated: str
    walk_forward_folds: str

    def to_dict(self) -> dict[str, Any]:
        """Convert metrics to serializable dictionary."""
        return {
            "mae": self.mae,
            "std_dev": self.std_dev,
            "directional_accuracy": self.directional_accuracy,
            "last_validated": self.last_validated,
            "walk_forward_folds": self.walk_forward_folds,
        }


class ModelInterface(ABC):
    """Abstract interface for BDI forecasting models.

    The ML team builds their model. The backend only talks to this interface.
    Swapping models = swapping the adapter class. Zero backend code changes.
    """

    @abstractmethod
    def predict(self, features: np.ndarray, horizon_days: int) -> ForecastResult:
        """Generate BDI forecast for N days with uncertainty bands.

        Args:
            features: 1D or 2D numpy array containing the most recent feature values
                     in the order defined by `get_feature_names()`.
            horizon_days: Number of days into the future to forecast (e.g. 1 to 30).

        Returns:
            ForecastResult containing forecasted dates, point estimates,
            confidence bounds, and SHAP feature importances.
        """
        ...

    @abstractmethod
    def explain(self, features: np.ndarray) -> dict[str, float]:
        """Return SHAP-based feature importance for current prediction.

        Args:
            features: 1D or 2D numpy array containing current feature values.

        Returns:
            Dictionary mapping human-readable feature display names to their
            signed SHAP contribution values.
        """
        ...

    @abstractmethod
    def get_metrics(self, horizon: str) -> ModelMetrics:
        """Return performance metrics for a specific horizon (1d/7d/14d/30d).

        Args:
            horizon: Horizon identifier string, one of '1d', '7d', '14d', '30d'.

        Returns:
            ModelMetrics object containing MAE, residual std dev, directional accuracy,
            validation date, and fold description.
        """
        ...

    @abstractmethod
    def get_feature_names(self) -> list[str]:
        """Return ordered list of feature names the model expects.

        Returns:
            List of feature names matching model training input columns.
        """
        ...

    @abstractmethod
    def get_all_model_comparison(self) -> dict:
        """Return comparison metrics for all models across all horizons.

        Compares benchmark models (Naive Persistence, Linear Regression,
        Random Forest) against LightGBM for 1d, 7d, 14d, and 30d forecast horizons.

        Returns:
            Nested dictionary with horizon keys and model comparison metric tables.
        """
        ...
