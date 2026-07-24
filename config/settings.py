from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Excel Assistant"
    app_version: str = "1.0.0"
    app_env: str = "development"

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # Agent loop — read from the environment (unprefixed), not hardcoded, so
    # the loop controller's budget can change without a code change.
    max_steps: int = Field(default=5, alias="MAX_STEPS")

    # Per-call SQLite busy-timeout (seconds) used by the repository layer so
    # a hung/locked DB call fails fast instead of blocking the tool retry
    # loop indefinitely.
    tool_timeout_seconds: float = Field(default=5.0, alias="TOOL_TIMEOUT_SECONDS")

    # LLM provider selection: LLM_PROVIDER/LLM_MODEL are generic so the same
    # settings shape works for any provider; the API key is provider-specific
    # so multiple providers can be configured side by side.
    llm_provider: str = Field(default="groq", alias="LLM_PROVIDER")
    llm_model: str = Field(default="llama-3.3-70b-versatile", alias="LLM_MODEL")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")

    # Static per-model pricing table ($ per 1K tokens), used to compute
    # cost_usd for every LLM call without any external pricing lookup.
    PRICING: dict = {
        "llama-3.3-70b-versatile": {"input_per_1k": 0.00059, "output_per_1k": 0.00079},
    }

    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )


settings = Settings()
