from pydantic import BaseModel, Field
from typing import Optional, List
from .forecast import ForecastDataPoint, ShapFeature

class ScenarioRequest(BaseModel):
    """Request for running custom scenarios."""
    base_horizon_days: int = Field(default=30)
    brent_price_change_pct: float = Field(default=0.0)
    usd_inr_change_pct: float = Field(default=0.0)
    bunker_fuel_change_pct: float = Field(default=0.0)
    iron_ore_demand_change_pct: float = Field(default=0.0)
    coal_demand_change_pct: float = Field(default=0.0)
    port_congestion_extra_days: float = Field(default=0.0)
    tonne_mile_shock_pct: float = Field(default=0.0)

class DisruptionPreset(BaseModel):
    """Preset scenario adjustments."""
    id: str
    name: str
    description: str
    icon: str
    adjustments: ScenarioRequest

class ScenarioResponse(BaseModel):
    """Response containing scenario impact on forecasting."""
    base_forecast: List[ForecastDataPoint]
    adjusted_forecast: List[ForecastDataPoint]
    delta_bdi: float
    delta_pct: float
    shap_explanations: List[ShapFeature]
    cost_impact_usd: Optional[float] = None
    cost_impact_inr: Optional[float] = None
