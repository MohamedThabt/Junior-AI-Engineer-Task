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
    max_loop_iterations: int = Field(default=5, alias="MAX_LOOP_ITERATIONS")

    # Per-call SQLite busy-timeout (seconds) used by the repository layer so
    # a hung/locked DB call fails fast instead of blocking the tool retry
    # loop indefinitely.
    tool_timeout_seconds: float = Field(default=5.0, alias="TOOL_TIMEOUT_SECONDS")

    # Conversational-memory compaction. `MEMORY_WINDOW_TURNS` is how many of
    # the most recent history entries are sent to the LLM verbatim; anything
    # older is collapsed into a single summary recap so prompt size stops
    # growing linearly with session length. `MEMORY_MAX_DATA_CHARS` caps the
    # serialized size of a single tool-result `data` payload kept in history —
    # larger payloads are digested (row counts + ids retained, full rows
    # dropped) so one big query can't dominate the window.
    memory_window_turns: int = Field(default=12, alias="MEMORY_WINDOW_TURNS", ge=1)
    memory_max_data_chars: int = Field(default=2000, alias="MEMORY_MAX_DATA_CHARS", ge=1)

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
