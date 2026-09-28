"""Main entry point for SIH 2026 Freight Forecasting & Vessel Chartering Platform."""

import asyncio
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import Any, AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""
    # Create database tables
    create_db_and_tables()

    # Load static reference data
    data_dir = Path(__file__).parent / "data"
    app.state.port_data = json.loads((data_dir / "port_infrastructure.json").read_text(encoding="utf-8"))
    app.state.vessel_data = json.loads((data_dir / "vessel_specs.json").read_text(encoding="utf-8"))
    app.state.route_data = json.loads((data_dir / "sailing_distances.json").read_text(encoding="utf-8"))
    app.state.events_data = json.loads((data_dir / "historical_events.json").read_text(encoding="utf-8"))

    # Live telemetry data placeholders
    app.state.ais_data = {}
    app.state.weather_data = {}

    # Initialize live AIS tracking if API key is configured
    from app.services.ingestion.ais_congestion import AISCongestionTracker
    app.state.ais_tracker = AISCongestionTracker(api_key=settings.AISSTREAM_API_KEY)
    ais_task = None
    if settings.AISSTREAM_API_KEY:
        print(f"[OK] AISStream API key configured - launching live vessel tracking in Bay of Bengal...")
        ais_task = asyncio.create_task(app.state.ais_tracker.connect_and_track())

    # Pre-fetch live ocean weather conditions from Open-Meteo
    try:
        from app.services.ingestion.weather_ingestion import WeatherIngestion
        app.state.weather_data = WeatherIngestion.fetch_all_ports_weather()
        print(f"[OK] Live ocean weather loaded for {len(app.state.weather_data)} East Coast Indian ports.")
    except Exception as e:
        print(f"[!] Weather pre-fetch warning: {e}")

    # Load ML model (real plug-and-play architecture - zero mock adapters)
    model_dir = Path(settings.MODEL_DIR)
    if not model_dir.exists():
        candidate_dirs = [Path("backend") / settings.MODEL_DIR, Path(__file__).resolve().parent.parent / settings.MODEL_DIR]
        for cd in candidate_dirs:
            if cd.exists():
                model_dir = cd
                break

    if (model_dir / "freight_h1.pkl").exists():
        from app.services.adapters.teammate_model_adapter import TeammateModelAdapter
        app.state.model = TeammateModelAdapter(str(model_dir))
        print("[OK] Production TeammateFreightModel loaded from freight_h1.pkl (LightGBM + ARIMA + Naive Residuals + Decision Engine)")
    else:
        found_model_file = None
        for candidate in ["lgb_bdi_model.joblib", "model.joblib", "point_model.joblib", "bdi_model.joblib"]:
            if (model_dir / candidate).exists():
                found_model_file = candidate
                break

        if found_model_file is not None:
            from app.services.adapters.lightgbm_adapter import LightGBMAdapter
            app.state.model = LightGBMAdapter(str(model_dir))
            print(f"[OK] Production ML model '{found_model_file}' loaded - real predictions active")
        else:
            app.state.model = None
            print("[*] No model file in ml_models/ - MockAdapter removed. Awaiting teammate model drop.")

    yield

    # Teardown
    if ais_task:
        app.state.ais_tracker.is_running = False
        ais_task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    description="Freight Forecasting & Vessel Chartering Platform for India's East Coast Ports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import forecast, vessels, ports, scenarios, model_info, alerts

app.include_router(forecast.router, prefix=settings.API_V1_PREFIX)
app.include_router(vessels.router, prefix=settings.API_V1_PREFIX)
app.include_router(ports.router, prefix=settings.API_V1_PREFIX)
app.include_router(scenarios.router, prefix=settings.API_V1_PREFIX)
app.include_router(model_info.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check() -> dict[str, Any]:
    """Return health status, model loading, and live telemetry feed status."""
    ais_active = bool(getattr(app.state, "ais_tracker", None) and app.state.ais_tracker.is_running)
    has_model = getattr(app.state, "model", None) is not None
    return {
        "status": "healthy",
        "model_loaded": has_model,
        "model_type": type(app.state.model).__name__ if has_model else "AwaitingTeammateModel",
        "live_telemetry": {
            "ais_stream_active": ais_active,
            "open_meteo_weather": bool(getattr(app.state, "weather_data", {})),
            "ports_loaded": len(getattr(app.state, "port_data", [])),
        }
    }
