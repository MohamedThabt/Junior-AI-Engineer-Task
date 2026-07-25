"""Executor / Dispatcher (`docs/agent-architecture.md` §2.2).

The only place that maps a `PlannerDecision` tool call to actual Python
code. Tools are never called directly from the planner or loop controller
— everything goes through `dispatch()`.

Two failure classes, both structured (never a raised exception out of
this module):
- Dispatcher-level: unknown tool name, or args that fail Pydantic
  validation before the tool callable is ever invoked.
- Tool-level: the callable itself returns `success=False` (after its own
  internal retries) or raises unexpectedly.
"""

from __future__ import annotations

import time

from pydantic import ValidationError

from app.models.schemas import ToolResult
from app.tools.registry import TOOL_INPUT_MODELS, TOOL_REGISTRY
from app.utilities.logging_utils import log_tool_call
from app.utilities.tool_execution import format_validation_error


def dispatch(tool_name: str, args: dict, loop_iteration: int, request_id: str) -> ToolResult:
    if tool_name not in TOOL_REGISTRY:
        return ToolResult(
            success=False,
            data=None,
            error=f"Unknown tool: {tool_name}",
            tool=tool_name,
            attempts=0,
        )

    input_model = TOOL_INPUT_MODELS.get(tool_name)
    if input_model is not None:
        try:
            input_model.model_validate(args)
        except ValidationError as exc:
            return ToolResult(
                success=False,
                data=None,
                error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
                tool=tool_name,
                attempts=0,
            )

    tool_fn = TOOL_REGISTRY[tool_name]
    start = time.perf_counter()
    try:
        result = tool_fn(args, request_id=request_id, loop_iteration=loop_iteration)
    except Exception as exc:  # tool callable raised instead of returning ToolResult
        latency_ms = (time.perf_counter() - start) * 1000
        log_tool_call(
            request_id=request_id,
            loop_iteration=loop_iteration,
            tool_name=tool_name,
            args=args,
            attempt_number=1,
            latency_ms=latency_ms,
            success=False,
            error=str(exc),
        )
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name} raised an unexpected error: {exc}",
            tool=tool_name,
            attempts=1,
        )

    latency_ms = (time.perf_counter() - start) * 1000
    # `log_tool_call` already redacts sensitive arg keys internally
    # (key/token/secret/password/credential substring match) — no separate
    # redaction step needed here.
    log_tool_call(
        request_id=request_id,
        loop_iteration=loop_iteration,
        tool_name=tool_name,
        args=args,
        attempt_number=result.attempts or 1,
        latency_ms=latency_ms,
        success=result.success,
        error=result.error,
    )
    return result
