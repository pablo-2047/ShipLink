from sqlmodel import SQLModel, Field
from datetime import date as dt_date
from typing import Optional

class FreightRate(SQLModel, table=True):
    """Historical daily freight rate indices."""
    __tablename__ = "freight_rates"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt_date = Field(index=True)
    bdi_index: float
    bci_index: Optional[float] = None  # Capesize
    bpi_index: Optional[float] = None  # Panamax
    bsi_index: Optional[float] = None  # Supramax
    bhsi_index: Optional[float] = None  # Handysize
    bdry_close: Optional[float] = None  # BDRY ETF proxy
    source: str = "STOOQ"  # STOOQ, BDRY_PROXY, MANUAL
