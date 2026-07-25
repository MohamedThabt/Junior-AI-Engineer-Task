"""Structured JSON logging for the agent loop (LLM calls, tool calls, session
milestones) — distinct from `config/logger.py`, which covers HTTP
request/response middleware logging.

Every log line here is one JSON object, tagged with the `request_id` of the
incoming user request so a full trace (session start → every LLM call →
every tool call → finalize) can be reconstructed by grepping one id.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.utilities.redaction import redact_mapping

LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
_LOGGER_NAME = "app.agent"

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def new_request_id() -> str:
    return str(uuid.uuid4())


def configure_logging() -> None:
    """Attach a JSON formatter to the agent logger, writing to
    `logs/app.log` and stdout — one JSON object per line."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter("%(message)s")

    file_handler = logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8")
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger(_LOGGER_NAME)
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.propagate = False


def _get_logger() -> logging.Logger:
    logger = logging.getLogger(_LOGGER_NAME)
    if not logger.handlers:
        configure_logging()
    return logger


def _redact(args: dict[str, Any] | None) -> dict[str, Any] | None:
    return redact_mapping(args)


def _emit(entry: dict[str, Any]) -> None:
    """Write one JSON log line. Wrapped so a logging failure never crashes
    the request it's trying to describe."""
    try:
        entry.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        _get_logger().info(json.dumps(entry, default=str))
    except Exception:
        pass


def log_llm_call(
    *,
    request_id: str,
    loop_iteration: int,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    latency_ms: float,
    cost_usd: float,
    attempt_number: int,
    success: bool,
    error: str | None,
) -> None:
    _emit(
        {
            "event": "llm_call",
            "request_id": request_id,
            "loop_iteration": loop_iteration,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "latency_ms": latency_ms,
            "cost_usd": cost_usd,
            "attempt_number": attempt_number,
            "success": success,
            "error": error,
        }
    )


def log_tool_call(
    *,
    request_id: str,
    loop_iteration: int,
    tool_name: str,
    args: dict[str, Any] | None,
    attempt_number: int,
    latency_ms: float,
    success: bool,
    error: str | None,
    result: Any | None = None,
) -> None:
    _emit(
        {
            "event": "tool_call",
            "request_id": request_id,
            "loop_iteration": loop_iteration,
            "tool_name": tool_name,
            "args": _redact(args),
            "attempt_number": attempt_number,
            "latency_ms": latency_ms,
            "success": success,
            "error": error,
            "result": result,
        }
    )


def log_security_event(*, request_id: str, pattern_type: str) -> None:
    """Distinct log line for a rejected request (`AgentController`).

    Only the matched *pattern type* is logged (e.g. `"email"`, `"api_key"`)
    — never the matched value itself, so a secret can never leak into the
    log file via this path."""
    _emit(
        {
            "event": "security_reject",
            "request_id": request_id,
            "pattern_type": pattern_type,
        }
    )


def log_guardrail_event(
    *, request_id: str, allowed: bool, model: str, error: str | None = None
) -> None:
    """Distinct log line for the pre-planner input guardrail decision.

    Records only whether the request was allowed through, the classifier
    model used, and an optional error tag — never the user's message text,
    keeping the same "reconstruct the run by request_id" story as the other
    agent log lines."""
    _emit(
        {
            "event": "guardrail_check",
            "request_id": request_id,
            "allowed": allowed,
            "model": model,
            "error": error,
        }
    )


def log_session_event(event: str, session_id: str, request_id: str, is_new: bool) -> None:
    """Distinct milestone log for session start/resume — the anchor line for
    tracing a full request end-to-end by `request_id`."""
    _emit(
        {
            "event": event,
            "session_id": session_id,
            "request_id": request_id,
            "is_new": is_new,
        }
    )


def timed() -> float:
    """Small helper so callers don't need to import `time` themselves."""
    return time.perf_counter()
