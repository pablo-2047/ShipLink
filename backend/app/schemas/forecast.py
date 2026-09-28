from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from .model_info import SingleModelMetrics

class ForecastRequest(BaseModel):
    """Request payload for BDI forecasting."""
    horizon_days: int = Field(default=30, ge=1, le=90, description="Forecast horizon in days")
    scenario_adjustments: Optional[Dict[str, Any]] = Field(default=None, description="Optional overrides for scenario planning")

class ForecastDataPoint(BaseModel):
    """A single data point in the forecast."""
    date: str
    predicted_bdi: float
    confidence_lower: float
    confidence_upper: float

class ShapFeature(BaseModel):
    """SHAP feature impact explanation."""
    feature: str
    display_name: str
    impact: float
    base_value: float

class MarketEntrySignal(BaseModel):
    """Market entry signal recommendations."""
    signal: Literal["ENTER_NOW", "WAIT", "NEUTRAL"]
    reason: str
    estimated_savings_usd: Optional[float] = None
    optimal_window: Optional[str] = None

class ForecastResponse(BaseModel):
    """Response payload for BDI forecasting."""
    model_config = {"protected_namespaces": ()}

    current_bdi: float
    forecast: List[ForecastDataPoint]
    model_performance: SingleModelMetrics
    shap_explanations: List[ShapFeature]
    trend_summary: str
    market_entry: MarketEntrySignal

class HistoricalDataPoint(BaseModel):
    """A single data point for historical data."""
    date: str
    bdi: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
