# Issue #12 — Finalize node

**Labels:** `agent`
**Depends on:** #3, #11

## Task
Implement `app/agent/finalize.py` per `docs/agent-architecture.md` §2.4.

## Deliverables

### `run_finalize(answer: str) -> ToolResult`
- Called when the LLM invokes the `finalize` tool.
- Wraps the LLM's natural-language `answer` in a `ToolResult` (`tool="finalize"`, `success=True`, `data={"answer": answer}`).
- This is the normal loop-exit path.

### `forced_finalize(context: list) -> ToolResult`
- Called by the loop controller when `step_count >= max_steps` and the LLM has NOT called `finalize`.
- Constructs a best-effort answer from tool results already in `context`.
- If no usable results exist: returns the fixed message `"I wasn't able to complete this within the step budget."`
- Does **not** make another LLM call — guarantees termination at exactly `max_steps` LLM calls.

### `graceful_fallback() -> ToolResult`
- Called on any unhandled exception in the loop.
- Returns a fixed, user-safe message: `"Something went wrong processing that request — please try again or rephrase it."`
- Never exposes internals / stack traces.

## Rules
- `finalize` never touches the repository or DB.
- All three return the standard `ToolResult` envelope.

## Tests
- `run_finalize` echoes the answer.
- `forced_finalize` with results → summarizes; with empty context → fixed budget message.
- `graceful_fallback` returns the fixed safe string, no internals.
