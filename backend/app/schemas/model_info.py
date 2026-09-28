from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import date

class SingleModelMetrics(BaseModel):
    """Metrics for a single model."""
    mae: float = Field(..., description="Mean Absolute Error")
    std_dev: float = Field(..., description="Standard Deviation of residuals")
    directional_accuracy: float = Field(..., description="Directional Accuracy percentage (0-100)")

class HorizonPerformance(BaseModel):
    """Model performance grouped by horizon."""
    horizon: str = Field(..., description="E.g. '7-day', '30-day'")
    naive: SingleModelMetrics
    linear: SingleModelMetrics
    random_forest: SingleModelMetrics
    lightgbm: SingleModelMetrics

class ModelPerformanceResponse(BaseModel):
    """Overall model performance response."""
    horizons: List[HorizonPerformance]
    last_validated: str
    walk_forward_folds: str
    current_model: str
