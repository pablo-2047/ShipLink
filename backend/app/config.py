"""Configuration settings for ShipLink backend."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    # App
    APP_NAME: str = "ShipLink"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./freight.db"

    # API Keys
    FRED_API_KEY: str = ""
    AISSTREAM_API_KEY: str = ""
    EIA_API_KEY: str = ""
    OILPRICE_API_KEY: str = ""

    # Model
    MODEL_DIR: str = "ml_models"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Retrieve cached singleton instance of application settings."""
    return Settings()
