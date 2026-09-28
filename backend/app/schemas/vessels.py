from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import date

class CargoInput(BaseModel):
    """Cargo input for vessel optimization."""
    cargo_type: str
    tonnage_mt: float
    origin_port: str
    destination_port: str
    laycan_start: date
    laycan_end: date
    contract_type: Literal["SPOT", "SHORT_TERM", "MID_TERM"]

class VesselRecommendation(BaseModel):
    """Recommendation for a specific vessel class."""
    vessel_class: str
    suitability_score: float = Field(..., ge=0, le=100)
    fits_origin: bool
    fits_destination: bool
    voyages_needed: int
    estimated_voyage_days: float
    estimated_fuel_cost_usd: float
    estimated_charter_cost_usd: float
    cargo_utilization_pct: float
    draft_clearance_m: float
    recommendation_reason: str

class AlternativePort(BaseModel):
    """Alternative port recommendation."""
    port_name: str
    reason: str
    max_vessel_class: str

class VesselOptimizationResponse(BaseModel):
    """Response containing vessel recommendations."""
    recommended: VesselRecommendation
    alternatives: List[VesselRecommendation]
    warnings: List[str]
    alternative_ports: List[AlternativePort]

class ContractComparison(BaseModel):
    """Comparison of different contract terms."""
    spot: Dict[str, Any]
    short_term: Dict[str, Any]
    mid_term: Dict[str, Any]
    recommendation: str
    reason: str
    forecast_trend_slope: float

class IdleStrategy(BaseModel):
    """Strategy for idle vessels."""
    strategy: str
    reason: str
    suggested_positioning: Optional[str] = None
    estimated_idle_days: float
