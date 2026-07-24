"""Factory for provider-specific LLM clients.

`app/agent/llm_client.py` is the only caller — it asks this module for a
client via `get_llm_client(provider)` and calls `.generate(...)` on it,
without knowing which provider (Gemini today, others later) is behind it.
Adding a new provider is a new `LLMProviderClient` subclass plus one entry
in `_REGISTRY`; no other call site changes.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from config.settings import settings


class LLMProviderClient(ABC):
    """Common interface every provider-specific client must implement."""

    @abstractmethod
    def generate(self, messages: list[dict], tools: list[dict], model: str) -> Any:
        """Make one generation call and return the provider's raw response.

        `messages` is a list of `{"role": ..., "content": ...}` dicts and
        `tools` is a list of JSON-schema-style function definitions
        (`{"name", "description", "parameters"}`) — the same shape
        `app/tools/registry.py` will expose regardless of provider.
        """


class GeminiClient(LLMProviderClient):
    """Wraps the `google-genai` SDK for the Gemini Developer API."""

    def __init__(self, api_key: str | None = None):
        # Imported lazily so importing this module never requires the SDK
        # to be installed unless the Gemini provider is actually selected.
        from google import genai

        self._genai = genai
        # google-genai falls back to the GEMINI_API_KEY/GOOGLE_API_KEY env
        # vars if api_key is None — passing it explicitly keeps the key
        # sourced from our own settings, not an ambient env var.
        self._client = genai.Client(api_key=api_key or settings.gemini_api_key)

    def _build_tools(self, tools: list[dict]):
        from google.genai import types

        if not tools:
            return None
        declarations = [
            types.FunctionDeclaration(
                name=tool["name"],
                description=tool.get("description", ""),
                parameters=tool.get("parameters"),
            )
            for tool in tools
        ]
        return [types.Tool(function_declarations=declarations)]

    def _build_contents(self, messages: list[dict]):
        from google.genai import types

        contents = []
        for message in messages:
            role = "model" if message.get("role") == "assistant" else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=message.get("content", ""))],
                )
            )
        return contents

    def generate(self, messages: list[dict], tools: list[dict], model: str) -> Any:
        from google.genai import types

        config = types.GenerateContentConfig(
            tools=self._build_tools(tools),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        return self._client.models.generate_content(
            model=model,
            contents=self._build_contents(messages),
            config=config,
        )


_REGISTRY: dict[str, type[LLMProviderClient]] = {
    "gemini": GeminiClient,
}


def get_llm_client(provider: str) -> LLMProviderClient:
    """Instantiate the `LLMProviderClient` registered for `provider`.

    Raises `ValueError` for an unregistered provider name rather than
    guessing or silently falling back to a default.
    """
    provider_key = provider.lower()
    client_cls = _REGISTRY.get(provider_key)
    if client_cls is None:
        known = ", ".join(sorted(_REGISTRY)) or "none"
        raise ValueError(f"Unknown LLM provider '{provider}'. Known providers: {known}.")
    return client_cls()
