from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class PortInfo(BaseModel):
    """Detailed port information."""
    id: str
    name: str
    country: str
    coast: str
    latitude: float
    longitude: float
    max_draft_m: float
    max_loa_m: float
    max_beam_m: float
    cargo_handling_rate_mt_day: float
    max_vessel_class: str
    is_tidal: bool
    notes: str
    major_cargoes: List[str]
    monsoon_impact: str

class CongestionStatus(BaseModel):
    """Current congestion status of a port."""
    port_id: str
    port_name: str
    vessels_waiting: int
    avg_wait_hours: float
    level: Literal["GREEN", "AMBER", "RED"]
    estimated_demurrage_risk_usd: float
    wave_height_m: Optional[float] = None
    weather_severity: Optional[str] = None
    operational_impact: str

class PortUtilization(BaseModel):
    """Historical or predicted port utilization."""
    port_id: str
    dates: List[str]
    utilization_pct: List[float]
