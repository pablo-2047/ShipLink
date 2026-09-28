from sqlmodel import SQLModel, Field
from datetime import date as dt_date
from typing import Optional

class ChokepointTransit(SQLModel, table=True):
    """Daily vessel transit counts through global chokepoints (from IMF PortWatch)."""
    __tablename__ = "chokepoint_transits"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt_date = Field(index=True)
    chokepoint: str = Field(index=True)  # "Suez Canal", "Bab el-Mandeb", etc.
    total_transits: int
    dry_bulk_transits: Optional[int] = None
    tanker_transits: Optional[int] = None
    container_transits: Optional[int] = None
    total_capacity_dwt: Optional[float] = None
