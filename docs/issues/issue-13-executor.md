# Issue #13 — Executor / Dispatcher

**Labels:** `agent`
**Depends on:** #4, #11, #12

## Task
Implement `app/agent/executor.py` per `docs/agent-architecture.md` §2.2.

## Deliverables

### `dispatch(tool_name: str, args: dict, loop_iteration: int) -> ToolResult`
1. Look up `tool_name` in `TOOL_REGISTRY` — if not found, return `ToolResult(success=False, error="Unknown tool: {tool_name}", tool=tool_name, attempts=0, data=None)` immediately.
2. Validate `args` against the tool's Pydantic input model — if validation fails, return a structured error immediately (repository never called).
3. Call the tool callable; capture start/end time.
4. Call `log_tool_call(...)` with: tool name, args (sensitive fields redacted), loop iteration, latency, outcome.
5. Return the tool's `ToolResult` directly.

## Rules
- Only place that maps an LLM tool-call decision to actual Python code.
- Dispatcher-level failures (unknown tool, bad args) are distinct from tool-level failures (repository errors after retries).
- Executor does **not** retry — tools own their own retry loop (#9, #10).
- Sensitive field redaction: replace any arg key matching `["key", "token", "secret", "password", "api_key"]` with `"[REDACTED]"` before logging.

## Tests
- Unknown tool name → structured error, no callable invoked.
- Pydantic validation failure → structured error, callable never invoked.
- Valid call → returns the tool's `ToolResult` unchanged.
