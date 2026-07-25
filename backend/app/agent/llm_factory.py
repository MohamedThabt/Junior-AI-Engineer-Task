"""Factory for provider-specific LLM clients.

`app/agent/llm_client.py` is the only caller — it asks this module for a
client via `get_llm_client(provider)` and calls `.generate(...)` on it,
without knowing which provider (Groq today, others later) is behind it.
Adding a new provider is a new `LLMProviderClient` subclass plus one entry
in `_REGISTRY`; no other call site changes.
"""

from __future__ import annotations

import json
import logging
import re
from abc import ABC, abstractmethod
from types import SimpleNamespace
from typing import Any

from config.settings import settings

logger = logging.getLogger(__name__)

# Llama tool-calling models are trained to emit function calls as raw text
# in the form `<function=name>{...json args...}</function>`; Groq normally
# parses that into a structured `tool_calls` response for us. When the
# model mangles the separator right after the function name — dropping the
# `>`, using a space, doubling the `=`, etc. (all observed in practice) —
# Groq's parser gives up entirely and returns a 400 `tool_use_failed`
# instead of any usable response, even though the intended call is still
# fully present as text in the error's `failed_generation` field. `[^{]*`
# tolerates *any* separator junk between the name and its args, rather than
# enumerating each specific malformed variant seen so far.
_RAW_FUNCTION_CALL_PATTERN = re.compile(
    r"<function=(?P<name>\w+)[^{]*(?P<args>\{.*\})\s*</function>", re.DOTALL
)


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


class GroqClient(LLMProviderClient):
    """Wraps the `groq` SDK, which exposes an OpenAI-compatible chat
    completions API (`client.chat.completions.create(...)`)."""

    def __init__(self, api_key: str | None = None):
        # Imported lazily so importing this module never requires the SDK
        # to be installed unless the Groq provider is actually selected.
        from groq import Groq

        # The SDK falls back to the GROQ_API_KEY env var if api_key is
        # None — passing it explicitly keeps the key sourced from our own
        # settings, not an ambient env var.
        self._client = Groq(api_key=api_key or settings.groq_api_key)

    def _build_tools(self, tools: list[dict]) -> list[dict] | None:
        if not tools:
            return None
        return [
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("parameters"),
                },
            }
            for tool in tools
        ]

    def _build_messages(self, messages: list[dict]) -> list[dict]:
        """Translate stored history into Groq/OpenAI chat messages.

        Our history entries are already provider-native (see
        `app/agent/memory.py`), carrying an extra `meta` sidecar the provider
        must not see. Here we:
        - strip `meta` from every entry;
        - preserve an assistant `tool_calls` turn and its paired `tool` result
          (linked by `tool_call_id`) so the model gets a real call→result
          sequence and its function-calling training applies;
        - downgrade a *legacy* `tool` entry that has no `tool_call_id` (rows
          written before structured pairing existed) to a plain `user` turn,
          since Groq rejects an unpaired `tool` message.
        """
        built: list[dict] = []
        # Track which tool_call ids have an emitted assistant turn, so a `tool`
        # result whose call turn was trimmed by windowing is treated as legacy.
        known_call_ids: set[str] = set()

        for message in messages:
            role = message.get("role")

            if role == "assistant" and message.get("tool_calls"):
                tool_calls = message["tool_calls"]
                for call in tool_calls:
                    if isinstance(call, dict) and call.get("id"):
                        known_call_ids.add(call["id"])
                built.append(
                    {
                        "role": "assistant",
                        "content": message.get("content"),
                        "tool_calls": tool_calls,
                    }
                )
                continue

            if role == "tool":
                call_id = message.get("tool_call_id")
                if call_id and call_id in known_call_ids:
                    built.append(
                        {
                            "role": "tool",
                            "tool_call_id": call_id,
                            "content": message.get("content", ""),
                        }
                    )
                else:
                    # Unpaired / legacy tool result — fold into a user turn so
                    # the model still sees the outcome without a protocol error.
                    built.append({"role": "user", "content": message.get("content", "")})
                continue

            # system / assistant-answer / user / summary recap
            normalized_role = role if role in ("system", "assistant") else "user"
            built.append({"role": normalized_role, "content": message.get("content", "")})

        return built

    def _recover_from_tool_use_failed(self, error: Exception) -> Any | None:
        """Best-effort recovery for Groq's `tool_use_failed` 400 error.

        Returns a synthetic response shaped like a normal `ChatCompletion`
        (so `llm_client._parse_response` can consume it unchanged) if the
        error's `failed_generation` contains a recognizable raw function
        call; returns `None` (caller should re-raise) if it doesn't, so we
        never mask a genuinely different failure as a successful call.
        """
        body = getattr(error, "body", None)
        detail = body.get("error", {}) if isinstance(body, dict) else {}
        if detail.get("code") != "tool_use_failed":
            return None

        raw_generation = detail.get("failed_generation")
        if not isinstance(raw_generation, str):
            return None

        match = _RAW_FUNCTION_CALL_PATTERN.search(raw_generation)
        if not match:
            return None
        try:
            args = json.loads(match.group("args"))
        except (TypeError, ValueError):
            return None

        logger.warning(
            "GroqClient: recovered a malformed raw function call for tool %r "
            "from a tool_use_failed error instead of failing the loop iteration",
            match.group("name"),
        )
        tool_call = SimpleNamespace(
            function=SimpleNamespace(name=match.group("name"), arguments=json.dumps(args))
        )
        message = SimpleNamespace(content=None, tool_calls=[tool_call])
        usage = SimpleNamespace(prompt_tokens=0, completion_tokens=0, total_tokens=0)
        return SimpleNamespace(usage=usage, choices=[SimpleNamespace(message=message)])

    def generate(self, messages: list[dict], tools: list[dict], model: str) -> Any:
        from groq import BadRequestError

        try:
            return self._client.chat.completions.create(
                model=model,
                messages=self._build_messages(messages),
                tools=self._build_tools(tools),
                tool_choice="auto" if tools else None,
                # Deterministic output reduces how often Llama malformats
                # its raw function-call text (see `_recover_from_tool_use_
                # failed`) and cuts down on near-duplicate exploratory
                # tool calls across loop iterations.
                temperature=0,
            )
        except BadRequestError as exc:
            recovered = self._recover_from_tool_use_failed(exc)
            if recovered is None:
                raise
            return recovered


_REGISTRY: dict[str, type[LLMProviderClient]] = {
    "groq": GroqClient,
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
