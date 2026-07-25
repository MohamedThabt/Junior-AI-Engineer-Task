"""Finalize node — the loop's three exit paths (`docs/agent-architecture.md`
§2.4).

`finalize` itself never touches the repository or the database: all three
functions here only ever assemble a natural-language answer and wrap it in
the standard `ToolResult` envelope. None of them make an LLM call — that's
what guarantees the loop terminates.
"""

from __future__ import annotations

import json

from app.agent import memory
from app.models.schemas import ToolResult

FINALIZE_TOOL_NAME = "finalize"

_BUDGET_EXHAUSTED_MESSAGE = "I wasn't able to complete this within the step budget."
_FALLBACK_MESSAGE = (
    "Something went wrong processing that request — please try again or rephrase it."
)


def run_finalize(answer: str) -> ToolResult:
    """Normal loop-exit path: the LLM called `finalize` with its answer."""
    return ToolResult(
        success=True,
        data={"answer": answer},
        error=None,
        tool=FINALIZE_TOOL_NAME,
        attempts=1,
    )


def forced_finalize(context: list) -> ToolResult:
    """Called when `step_count >= max_steps` and the LLM never called
    `finalize`. Never makes another LLM call — this is what guarantees the
    request terminates at exactly `max_steps` LLM calls.

    *context* is expected to be scoped to the current request (see
    `loop_controller.run`), so the summary can never splice in a prior turn's
    tool results. Extraction is meta-aware with a legacy `content`-parse
    fallback (see `memory.successful_tool_results`)."""
    successes = memory.successful_tool_results(context)

    if not successes:
        answer = _BUDGET_EXHAUSTED_MESSAGE
    else:
        lines = [
            f"- {result.get('tool')}: {json.dumps(result.get('data'))}" for result in successes
        ]
        answer = (
            "I reached my step limit before finishing, but here is what I found so far:\n"
            + "\n".join(lines)
        )

    return ToolResult(
        success=True,
        data={"answer": answer},
        error=None,
        tool=FINALIZE_TOOL_NAME,
        attempts=1,
    )


def graceful_fallback() -> ToolResult:
    """Called on any unhandled exception in the loop. Fixed, user-safe
    message — never exposes internals or a stack trace."""
    return ToolResult(
        success=True,
        data={"answer": _FALLBACK_MESSAGE},
        error=None,
        tool=FINALIZE_TOOL_NAME,
        attempts=1,
    )
