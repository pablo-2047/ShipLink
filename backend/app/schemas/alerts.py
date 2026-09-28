from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class Alert(BaseModel):
    """System alert model."""
    id: str
    type: Literal["CONGESTION", "CYCLONE", "CHOKEPOINT", "MARKET_VOLATILITY", "WEATHER"]
    severity: Literal["CRITICAL", "WARNING", "INFO"]
    title: str
    description: str
    affected_ports: List[str]
    timestamp: str
    actionable_recommendation: Optional[str] = None

class AlertsResponse(BaseModel):
    """Response containing a list of alerts."""
    alerts: List[Alert]
    total_count: int
