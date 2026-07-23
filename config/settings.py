from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Excel Assistant"
    app_version: str = "1.0.0"
    app_env: str = "development"

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
