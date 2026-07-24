"""Single choke point for every LLM API call (used by the planner).

Wraps the provider call obtained from `app/agent/llm_factory.py` in
`try/except`, retries transient failures up to 2 times with backoff, and
logs every attempt (success or failure) via `log_llm_call`. This is the
only place in the codebase that talks to an LLM SDK/HTTP endpoint — the
planner calls `call_llm(...)` and never implements retry itself.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from app.agent.llm_factory import get_llm_client
from app.utilities.logging_utils import log_llm_call, request_id_var
from config.settings import settings

_MAX_ATTEMPTS = 3  # 1 initial attempt + 2 retries
_BACKOFF_SECONDS = (0.5, 1.0)  # delay before attempt 2, then before attempt 3


class LLMCallError(Exception):
    """Raised when all attempts of an LLM call have failed."""


@dataclass
class LLMResponse:
    raw: object
    tool_calls: list[dict] = field(default_factory=list)
    text: str | None = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


def _parse_response(raw) -> LLMResponse:
    """Parse a Groq/OpenAI-shaped `ChatCompletion` (`raw.usage`,
    `raw.choices[0].message`)."""
    usage = getattr(raw, "usage", None)
    prompt_tokens = getattr(usage, "prompt_tokens", 0) or 0
    completion_tokens = getattr(usage, "completion_tokens", 0) or 0
    total_tokens = getattr(usage, "total_tokens", 0) or (prompt_tokens + completion_tokens)

    message = raw.choices[0].message

    tool_calls = []
    for call in getattr(message, "tool_calls", None) or []:
        try:
            args = json.loads(call.function.arguments or "{}")
        except (TypeError, ValueError):
            args = {}
        tool_calls.append({"tool_name": call.function.name, "args": args})

    text = getattr(message, "content", None)

    return LLMResponse(
        raw=raw,
        tool_calls=tool_calls,
        text=text,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )


def _compute_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    rates = settings.PRICING.get(model)
    if not rates:
        return 0.0
    input_cost = (prompt_tokens / 1000) * rates.get("input_per_1k", 0.0)
    output_cost = (completion_tokens / 1000) * rates.get("output_per_1k", 0.0)
    return round(input_cost + output_cost, 8)


def call_llm(
    messages: list[dict],
    tools: list[dict],
    model: str,
    step_number: int,
    request_id: str | None = None,
) -> LLMResponse:
    rid = request_id or request_id_var.get("")
    last_error: Exception | None = None

    for attempt_number in range(1, _MAX_ATTEMPTS + 1):
        start = time.perf_counter()
        success = False
        error_message: str | None = None
        response: LLMResponse | None = None

        try:
            client = get_llm_client(settings.llm_provider)
            raw = client.generate(messages=messages, tools=tools, model=model)
            response = _parse_response(raw)
            success = True
        except Exception as exc:  # network errors, rate limits, timeouts, etc.
            last_error = exc
            error_message = str(exc)
        finally:
            latency_ms = (time.perf_counter() - start) * 1000
            cost_usd = (
                _compute_cost_usd(model, response.prompt_tokens, response.completion_tokens)
                if response is not None
                else 0.0
            )
            log_llm_call(
                request_id=rid,
                step_number=step_number,
                model=model,
                prompt_tokens=response.prompt_tokens if response else 0,
                completion_tokens=response.completion_tokens if response else 0,
                total_tokens=response.total_tokens if response else 0,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                attempt_number=attempt_number,
                success=success,
                error=error_message,
            )

        if success and response is not None:
            return response

        if attempt_number < _MAX_ATTEMPTS:
            time.sleep(_BACKOFF_SECONDS[attempt_number - 1])

    raise LLMCallError(
        f"call_llm failed after {_MAX_ATTEMPTS} attempts (model='{model}'): {last_error}"
    )
