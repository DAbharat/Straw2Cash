"""
Configuration module for Python AI/ML Service.
Reads settings from environment variables or .env file.
"""

from typing import Literal, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Service Identity
    PROJECT_NAME: str = "Parallels Exchange AI/ML Service"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    DEBUG: bool = True

    # CORS configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8001",
    ]

    # NASA FIRMS API
    # Free map key from https://firms.modaps.eosdis.nasa.gov/api/map_key/
    FIRMS_MAP_KEY: Optional[str] = None
    FIRMS_DEFAULT_SOURCE: str = "VIIRS_NOAA20_NRT"  # VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT, VIIRS_SNPP_NRT
    FIRMS_CACHE_TTL_SECONDS: int = 1800  # 30 minutes cache to avoid burning NASA request quotas
    FIRMS_REQUEST_TIMEOUT_SECONDS: float = 10.0

    # Regional Bounding Box Defaults (Northern India: Punjab & Haryana core area)
    DEFAULT_BBOX_MIN_LAT: float = 29.5
    DEFAULT_BBOX_MIN_LON: float = 74.0
    DEFAULT_BBOX_MAX_LAT: float = 32.5
    DEFAULT_BBOX_MAX_LON: float = 77.0

    # Upstream Services
    GO_BACKEND_URL: str = "http://localhost:8000"
    JAVA_BACKEND_URL: str = "http://localhost:8080"
    UPSTREAM_TIMEOUT_SECONDS: float = 5.0

    # AI Model Provider Configuration
    # Options: "mock" (offline/zero-cost demo), "bedrock" (Amazon Bedrock), "ollama" (local), "gemini" (Google Gemini)
    MODEL_PROVIDER: Literal["mock", "bedrock", "ollama", "gemini"] = "mock"
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    BEDROCK_REGION: str = "ap-south-1"  # Mumbai region default for lowest latency
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_SESSION_TOKEN: Optional[str] = None

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Local Ollama fallback
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"


settings = Settings()
