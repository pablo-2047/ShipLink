from sqlmodel import SQLModel, Field
from datetime import date as dt_date
from typing import Optional

class EconomicIndicator(SQLModel, table=True):
    """Daily economic and commodity data."""
    __tablename__ = "economic_indicators"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt_date = Field(index=True)
    brent_crude_usd: Optional[float] = None
    vlsfo_usd_mt: Optional[float] = None
    mgo_usd_mt: Optional[float] = None
    ifo380_usd_mt: Optional[float] = None
    usd_inr: Optional[float] = None
    coal_price_usd: Optional[float] = None
    iron_ore_price_usd: Optional[float] = None
    source: str = "MIXED"
