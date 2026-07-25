"""Loop Controller (`docs/agent-architecture.md` §2.3).

Owns `loop_iteration_count`/`max_loop_iterations` for the current request
and drives the loop-iteration -> plan -> dispatch -> append cycle. The loop
has exactly three exit paths: (a) the LLM calls `finalize`, (b)
`loop_iteration_count >= max_loop_iterations`, (c) an unhandled exception.
Session context is always loaded at the start and persisted before
returning — it is never held only in process memory across requests.

Deliberate deviation from the issue-15 pseudocode (confirmed in planning):
the assistant's final answer (from `finalize`, forced-finalize, or the
fallback) is also appended to context before persisting — otherwise a
session would retain past user messages and tool results but never its
own past answers, breaking cross-request conversational memory. See
`DECISIONS.md`.

History shape is owned by `app/agent/memory.py`: every entry is a
provider-native message plus a `meta` sidecar. Each loop iteration records
the assistant's `tool_calls` decision (tool + args) *before* dispatch and the
paired `tool` result after, linked by `call_id`, so the stored thread keeps
both intent and outcome. `prepare_context` windows/summarizes what is sent
to the LLM; `compact_for_persist` bounds what is stored.
"""

from __future__ import annotations

import time

from app.agent import executor, guardrail, memory, planner
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
    resolved_session_id, context, is_new, loaded_version = ChatSessionRepository.get_or_create(
        session_id, _default_session_name(user_message)
    )
    log_session_event(
        "session_start" if is_new else "session_resume",
        resolved_session_id,
        request_id,
        is_new,
    )

    context.append(memory.user_entry(user_message, request_id))

    loop_iteration_count = 0
    max_loop_iterations = settings.max_loop_iterations
    system_prompt = build_system_prompt(max_loop_iterations)

    try:
        # Input guardrail: judge scope before spending any planner loop
        # iterations. Runs inside the try/finally so a refusal is still
        # persisted to the session (and can never leak a stack trace).
        if settings.guardrail_enabled:
            scope = guardrail.check_scope(user_message, request_id)
            if not scope.allowed:
                context.append(memory.assistant_answer_entry(scope.message, request_id))
                return scope.message, resolved_session_id

        result = None
        while True:
            loop_iteration_count += 1
            # Window/summarize before every LLM call so prompt size is bounded
            # by MEMORY_WINDOW_TURNS rather than total session length.
            llm_context = memory.prepare_context(context)
            decision = planner.plan(system_prompt, llm_context, TOOL_SCHEMAS, loop_iteration_count)

            if decision.type == "finalize":
                result = run_finalize(decision.answer)
                break

            # Record the assistant's decision (tool + args) BEFORE dispatching,
            # then the paired result — so history keeps both the intent and the
            # outcome, linked by call_id.
            call_id = memory.make_call_id(request_id, loop_iteration_count)
            context.append(
                memory.tool_call_entry(
                    call_id, decision.tool_name, decision.args, request_id, loop_iteration_count
                )
            )
            tool_started_at = time.perf_counter()
            result = executor.dispatch(decision.tool_name, decision.args, loop_iteration_count, request_id)
            tool_latency_ms = (time.perf_counter() - tool_started_at) * 1000
            context.append(
                memory.tool_result_entry(
                    call_id, result, request_id, loop_iteration_count, latency_ms=tool_latency_ms
                )
            )

            if loop_iteration_count >= max_loop_iterations:
                # Scope the budget-exhausted summary to THIS request only, so a
                # prior turn's tool results can never leak into it.
                result = forced_finalize(memory.entries_for_request(context, request_id))
                break

        answer = result.data["answer"]
        context.append(memory.assistant_answer_entry(answer, request_id))
        return answer, resolved_session_id
    except Exception:
        get_logger().error(
            "Unhandled exception in agent loop",
            exc_info=True,
            extra={"request_id": request_id},
        )
        result = graceful_fallback()
        answer = result.data["answer"]
        context.append(memory.assistant_answer_entry(answer, request_id))
        return answer, resolved_session_id
    finally:
        ChatSessionRepository.save_context(
            resolved_session_id,
            memory.compact_for_persist(context),
            expected_version=loaded_version,
        )
