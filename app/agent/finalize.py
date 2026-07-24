"""Finalize node — the loop's three exit paths (`docs/agent-architecture.md`
§2.4).

`finalize` itself never touches the repository or the database: all three
functions here only ever assemble a natural-language answer and wrap it in
the standard `ToolResult` envelope. None of them make an LLM call — that's
what guarantees the loop terminates.
"""

from __future__ import annotations

import json

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


def _extract_successful_tool_results(context: list) -> list[dict]:
    """Pull out the `data`/`tool` of every successful tool-result entry
    appended to *context* this request (`{"role": "tool", "content": <json
    ToolResult envelope>}`). Malformed/foreign entries are skipped rather
    than raising — this is a best-effort summary, not a strict parser."""
    successes: list[dict] = []
    for entry in context:
        if not isinstance(entry, dict) or entry.get("role") != "tool":
            continue
        try:
            payload = json.loads(entry["content"])
        except (KeyError, TypeError, ValueError):
            continue
        if isinstance(payload, dict) and payload.get("success"):
            successes.append(payload)
    return successes


def forced_finalize(context: list) -> ToolResult:
    """Called when `step_count >= max_steps` and the LLM never called
    `finalize`. Never makes another LLM call — this is what guarantees the
    request terminates at exactly `max_steps` LLM calls."""
    successes = _extract_successful_tool_results(context)

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
