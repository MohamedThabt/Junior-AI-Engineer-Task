"""Planner (`docs/agent-architecture.md` §2.1).

One LLM call per loop iteration, decision only. Never touches the database, never
contains business logic, never calls a tool directly — it only ever
produces a `PlannerDecision` for the executor/loop controller to act on.
Retries live entirely in `llm_client.call_llm` — `LLMCallError` propagates
unchanged so the loop controller can turn it into a graceful fallback.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from app.agent.finalize import FINALIZE_TOOL_NAME
from app.agent.llm_client import call_llm
from config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class PlannerDecision:
    type: Literal["tool_call", "finalize"]
    tool_name: str | None = None
    args: dict | None = None
    answer: str | None = None


def plan(system_prompt: str, context: list, tool_schemas: list, loop_iteration: int) -> PlannerDecision:
    messages = [{"role": "system", "content": system_prompt}, *context]

    response = call_llm(
        messages=messages,
        tools=tool_schemas,
        model=settings.llm_model,
        loop_iteration=loop_iteration,
    )

    if response.tool_calls:
        if len(response.tool_calls) > 1:
            logger.warning(
                "planner: LLM returned %d tool calls in one turn; dispatching only the first",
                len(response.tool_calls),
            )
        call = response.tool_calls[0]
        if call["tool_name"] == FINALIZE_TOOL_NAME:
            return PlannerDecision(type="finalize", answer=call["args"].get("answer", ""))
        return PlannerDecision(type="tool_call", tool_name=call["tool_name"], args=call["args"])

    # No tool call at all: the LLM answered in plain text instead of calling
    # `finalize` as instructed. Treat it as an implicit finalize rather than
    # erroring the loop iteration, so a compliant-but-imperfect model still
    # resolves.
    answer = response.text or "I don't have a specific answer for that."
    return PlannerDecision(type="finalize", answer=answer)
