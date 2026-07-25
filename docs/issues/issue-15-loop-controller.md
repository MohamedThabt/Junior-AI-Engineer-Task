# Issue #15 — Loop controller

**Labels:** `agent`
**Depends on:** #6, #12, #13, #14

## Task
Implement `app/agent/loop_controller.py` per `docs/agent-architecture.md` §2.3.

## Deliverables

### `run(session_id: str | None, user_message: str, request_id: str) -> str`

**Startup:**
1. Call `ChatSessionRepository.get_or_create(session_id)` → get `ChatSession` and `is_new` flag.
2. Call `log_session_event(event="session_start"|"session_resume", session_id, request_id, is_new)`.
3. `loop_iteration_count = 0`; `max_loop_iterations = settings.MAX_LOOP_ITERATIONS`.
4. Append the user message to the in-memory context list.

**Loop (repeat until exit):**
1. `loop_iteration_count += 1`
2. `decision = planner.plan(system_prompt, context, TOOL_SCHEMAS, loop_iteration_count)`
3. If `decision.type == "finalize"` → `result = run_finalize(decision.answer)` → break
4. Else → `result = executor.dispatch(decision.tool_name, decision.args, loop_iteration_count)`
5. Append result to context.
6. If `loop_iteration_count >= max_loop_iterations` → `result = forced_finalize(context)` → break

**Teardown (always, including on exception):**
- `ChatSessionRepository.save_context(session_id, context)`
- Return `result.data["answer"]`

**Exception handling:**
- Top-level `try/except` around the entire loop.
- Any unhandled exception → log at `ERROR` with full traceback → `result = graceful_fallback()` → still persist context → return.

## Rules
- `loop_iteration_count` resets to 0 on every new request — it is per-request, not cumulative.
- `max_loop_iterations` read from `settings.MAX_LOOP_ITERATIONS`, never hardcoded.
- Session context is always persisted before returning — never held only in memory across requests.
- The loop has exactly three exit paths: (a) LLM calls `finalize`, (b) `loop_iteration_count >= max_loop_iterations`, (c) unhandled exception.

## Tests
- Normal path: LLM calls finalize on loop iteration 2 → context persisted, answer returned.
- Forced finalize: LLM never calls finalize → exits at `max_loop_iterations`.
- Exception in executor → graceful fallback returned, context still persisted.
- New session created when `session_id=None`.
