import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"

    # Security & Auth
    SECRET_KEY: str = "e8f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_COOKIE_NAME: str = "travellord_session"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./travellord.db"

    # Routing & Geocoding
    ROUTING_PROVIDER: str = "osrm"
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    NOMINATIM_BASE_URL: str = "https://nominatim.openstreetmap.org"

    # External Data Feeds
    IMD_WEATHER_ENDPOINT: str = "https://mausam.imd.gov.in/api"
    ENABLE_LIVE_INTEGRATIONS: bool = True
    DATA_REFRESH_INTERVAL_MINUTES: int = 30

    # AI Assistant
    LLM_PROVIDER: str = "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"

    # Admin bootstrap
    ADMIN_BOOTSTRAP_EMAIL: str = "admin@travellord.ai"
    ADMIN_BOOTSTRAP_PASSWORD: str = "AdminSecureTravelLord2026!"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
