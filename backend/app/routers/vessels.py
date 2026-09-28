from fastapi import APIRouter, Request, Depends, HTTPException
from typing import Dict, Any

from app.services.vessel_optimizer import vessel_optimizer
from app.services.contract_comparator import contract_comparator

router = APIRouter(prefix="/vessels", tags=["Vessels"])

@router.post("/optimize")
async def optimize_vessel(request: Request, cargo_input: Dict[str, Any]):
    """Recommend vessel for cargo and route constraints."""
    try:
        port_data = getattr(request.app.state, "port_data", {})
        vessel_data = getattr(request.app.state, "vessel_data", {})
        route_data = getattr(request.app.state, "route_data", {})
        vlsfo_price = getattr(request.app.state, "vlsfo_price", 600.0)
        
        result = vessel_optimizer.optimize(cargo_input, port_data, vessel_data, route_data, vlsfo_price)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/types")
async def get_vessel_types(request: Request):
    """List all vessel types with specifications."""
    try:
        return getattr(request.app.state, "vessel_data", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract-compare")
async def compare_contracts(request: Request, payload: Dict[str, Any]):
    """Compare spot vs short-term vs mid-term chartering strategies."""
    try:
        current_rate = payload.get("current_rate", 15000.0)
        forecast_values = payload.get("forecast_values", [])
        voyage_days = payload.get("voyage_days", 15.0)
        usd_inr_rate = payload.get("usd_inr_rate", 83.5)
        
        result = contract_comparator.compare(current_rate, forecast_values, voyage_days, usd_inr_rate)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/idle-strategy")
async def idle_strategy(request: Request, payload: Dict[str, Any]):
    """Get idle time minimization recommendations."""
    return {"status": "success", "recommendation": "Reposition to EC India for upcoming coal demand spike."}
