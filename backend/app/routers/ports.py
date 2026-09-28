from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_session

from app.services.port_service import port_service

router = APIRouter(prefix="/ports", tags=["Ports"])

@router.get("/")
async def list_ports(request: Request):
    """List all ports with infrastructure."""
    try:
        port_data = getattr(request.app.state, "port_data", {})
        return port_service.get_all_ports(port_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/congestion-flags")
async def get_congestion_flags(request: Request):
    """All ports with live congestion, wave swell, and demurrage status."""
    try:
        port_data = getattr(request.app.state, "port_data", {})
        weather_data = getattr(request.app.state, "weather_data", {})
        if not weather_data:
            try:
                from app.services.ingestion.weather_ingestion import WeatherIngestion
                weather_data = WeatherIngestion.fetch_all_ports_weather()
                request.app.state.weather_data = weather_data
            except Exception:
                weather_data = {}

        ais_tracker = getattr(request.app.state, "ais_tracker", None)
        if ais_tracker and hasattr(ais_tracker, "get_congestion_snapshot"):
            ais_data = ais_tracker.get_congestion_snapshot()
        elif ais_tracker and hasattr(ais_tracker, "get_all_port_congestion"):
            ais_data = ais_tracker.get_all_port_congestion()
        else:
            ais_data = getattr(request.app.state, "ais_data", {})

        return port_service.get_congestion_flags(port_data, weather_data, ais_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freight-cost-impact")
async def get_freight_cost_impact(bdi_change: float = Query(...), vessel_type: str = Query("Capesize")):
    """Translates BDI index change to approximate charter rate change."""
    try:
        return port_service.estimate_freight_cost_impact(bdi_change, vessel_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{port_id}")
async def get_port_details(port_id: str, request: Request):
    """Single port details."""
    try:
        port_data = getattr(request.app.state, "port_data", {})
        res = port_service.get_port_by_id(port_id, port_data)
        if not res:
            raise HTTPException(status_code=404, detail="Port not found")
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{port_id}/utilization")
async def get_port_utilization(port_id: str, db: Session = Depends(get_session)):
    """Historical utilization trend."""
    try:
        return port_service.get_port_utilization(port_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
