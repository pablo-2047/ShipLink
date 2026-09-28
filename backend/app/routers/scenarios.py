from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import numpy as np

from app.services.scenario_service import scenario_service

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.post("/simulate")
async def simulate_scenario(request: Request, payload: Dict[str, Any]):
    """Run what-if with slider values."""
    try:
        model = request.app.state.model
        # Mock base features for simulation
        base_features = np.array([[1500.0, 1450.0, 85.0, 83.5, 120.0, 140.0, 2.5, 5000.0]])
        return scenario_service.simulate(model, payload, base_features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/presets")
async def get_presets():
    """List available disruption presets."""
    try:
        return scenario_service.get_disruption_presets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disruption")
async def apply_disruption(request: Request, payload: Dict[str, str]):
    """Apply a preset disruption."""
    try:
        preset_id = payload.get("preset_id")
        presets = scenario_service.get_disruption_presets()
        selected = next((p for p in presets if p["id"] == preset_id), None)
        if not selected:
            raise HTTPException(status_code=404, detail="Preset not found")
            
        model = request.app.state.model
        base_features = np.array([[1500.0, 1450.0, 85.0, 83.5, 120.0, 140.0, 2.5, 5000.0]])
        return scenario_service.simulate(model, {"adjustments": selected["adjustments"]}, base_features)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
