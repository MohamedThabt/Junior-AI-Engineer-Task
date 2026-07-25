"""Loop Controller (`docs/agent-architecture.md` §2.3).

Owns `step_count`/`max_steps` for the current request and drives the
step -> plan -> dispatch -> append cycle. The loop has exactly three exit
paths: (a) the LLM calls `finalize`, (b) `step_count >= max_steps`, (c) an
unhandled exception. Session context is always loaded at the start and
persisted before returning — it is never held only in process memory
across requests.

Deliberate deviation from the issue-15 pseudocode (confirmed in planning):
the assistant's final answer (from `finalize`, forced-finalize, or the
fallback) is also appended to context before persisting — otherwise a
session would retain past user messages and tool results but never its
own past answers, breaking cross-request conversational memory. See
`DECISIONS.md`.
"""

from __future__ import annotations

import json

from app.agent import executor, planner
from app.agent.finalize import forced_finalize, graceful_fallback, run_finalize
from app.agent.prompts import build_system_prompt
from app.repositories.chat_session_repository import ChatSessionRepository
from app.tools.registry import TOOL_SCHEMAS
from app.utilities.logging_utils import log_session_event
from config.logger import get_logger
from config.settings import settings

_DEFAULT_NAME_MAX_LENGTH = 40


def _default_session_name(user_message: str) -> str:
    trimmed = user_message.strip()
    if not trimmed:
        return "New session"
    if len(trimmed) <= _DEFAULT_NAME_MAX_LENGTH:
        return trimmed
    return trimmed[:_DEFAULT_NAME_MAX_LENGTH] + "..."


def run(session_id: str | None, user_message: str, request_id: str) -> tuple[str, str]:
    resolved_session_id, context, is_new = ChatSessionRepository.get_or_create(
        session_id, _default_session_name(user_message)
    )
    log_session_event(
        "session_start" if is_new else "session_resume",
        resolved_session_id,
        request_id,
        is_new,
    )

    context.append({"role": "user", "content": user_message})

    step_count = 0
    max_steps = settings.max_steps
    system_prompt = build_system_prompt(max_steps)

    try:
        result = None
        while True:
            step_count += 1
            decision = planner.plan(system_prompt, context, TOOL_SCHEMAS, step_count)

            if decision.type == "finalize":
                result = run_finalize(decision.answer)
                break

            result = executor.dispatch(decision.tool_name, decision.args, step_count, request_id)
            context.append({"role": "tool", "content": json.dumps(result.model_dump())})

            if step_count >= max_steps:
                result = forced_finalize(context)
                break

        answer = result.data["answer"]
        context.append({"role": "assistant", "content": answer})
        return answer, resolved_session_id
    except Exception:
        get_logger().error(
            "Unhandled exception in agent loop",
            exc_info=True,
            extra={"request_id": request_id},
        )
        result = graceful_fallback()
        answer = result.data["answer"]
        context.append({"role": "assistant", "content": answer})
        return answer, resolved_session_id
    finally:
        ChatSessionRepository.save_context(resolved_session_id, context)
