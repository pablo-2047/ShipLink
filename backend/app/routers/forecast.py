from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_session

from app.services.forecast_service import forecast_service

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.post("/predict")
async def predict_forecast(request: Request, horizon_days: int = 30, db: Session = Depends(get_session)):
    """Generate BDI forecast for a given horizon."""
    try:
        model = request.app.state.model
        result = forecast_service.generate_forecast(model, horizon_days, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
async def get_latest(db: Session = Depends(get_session)):
    """Get latest BDI value and 24h change."""
    try:
        return forecast_service.get_latest_bdi(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historical")
async def get_historical(
    start_date: Optional[str] = Query(None), 
    end_date: Optional[str] = Query(None), 
    limit: int = Query(2000),
    db: Session = Depends(get_session)
):
    """Get historical BDI data."""
    try:
        return forecast_service.get_historical_bdi(db, start_date or "", end_date or "", limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events")
async def get_events(request: Request):
    """Get annotated historical disruption events."""
    try:
        return getattr(request.app.state, "events_data", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

