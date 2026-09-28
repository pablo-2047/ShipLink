from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class PortCongestionRecord(SQLModel, table=True):
    """Periodic port congestion snapshots from AIS + weather."""
    __tablename__ = "port_congestion"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime  # When this snapshot was taken
    port_id: str = Field(index=True)  # e.g. "paradip"
    vessels_at_anchor: int = 0
    avg_wait_hours: float = 0.0
    congestion_level: str = "GREEN"  # GREEN, AMBER, RED
    wave_height_m: Optional[float] = None
    weather_severity: Optional[str] = None  # CALM, MODERATE, ROUGH, VERY_ROUGH
    estimated_demurrage_risk_usd: float = 0.0
