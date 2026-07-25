"""Shared retry helper for the tool layer (`app/tools/*_tools.py`).

Every data tool wraps its repository operation in `run_with_retry` instead
of re-implementing the same try/except/retry loop 8 times. Each individual
attempt already carries its own bounded SQLite busy-timeout
(`settings.tool_timeout_seconds`, applied inside the repository layer), so
no thread-based timeout is needed here — a hung/locked call simply raises
`sqlite3.OperationalError`, which this loop treats like any other failure.
"""

from __future__ import annotations

import time
from typing import Callable, TypeVar

from pydantic import ValidationError

from app.utilities.logging_utils import log_tool_call

T = TypeVar("T")

OnAttempt = Callable[[int, bool, str | None, float], None]


def run_with_retry(
    operation: Callable[[], T],
    *,
    max_attempts: int = 2,
    on_attempt: OnAttempt | None = None,
) -> tuple[T, int]:
    """Run *operation*, retrying on any exception up to *max_attempts* times total.

    `on_attempt(attempt_number, success, error, latency_ms)` is called after
    every attempt (success or failure) so the caller can log each one —
    the tool contract requires logging every attempt, not just the final
    outcome.

    Returns `(result, attempts_used)` on success. Raises the last exception
    once *max_attempts* attempts have all failed.
    """
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        start = time.perf_counter()
        try:
            result = operation()
        except Exception as exc:
            last_error = exc
            if on_attempt is not None:
                on_attempt(attempt, False, str(exc), (time.perf_counter() - start) * 1000)
            continue
        if on_attempt is not None:
            on_attempt(attempt, True, None, (time.perf_counter() - start) * 1000)
        return result, attempt

    raise last_error


def format_validation_error(exc: ValidationError) -> str:
    """Render a Pydantic ``ValidationError`` as one plain-language line."""
    parts = [f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in exc.errors()]
    return "; ".join(parts)


def make_attempt_logger(tool_name: str, request_id: str, loop_iteration: int, args: dict) -> OnAttempt:
    """Build an `on_attempt` callback that logs each retry attempt via `log_tool_call`."""

    def _log(attempt: int, success: bool, error: str | None, latency_ms: float) -> None:
        log_tool_call(
            request_id=request_id,
            loop_iteration=loop_iteration,
            tool_name=tool_name,
            args=args,
            attempt_number=attempt,
            latency_ms=latency_ms,
            success=success,
            error=error,
        )

    return _log
