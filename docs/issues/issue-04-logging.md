# Issue #4 — Structured logging infrastructure

**Labels:** `logging`
**Depends on:** #1

## Task
Implement the JSON logging foundation per `docs/agent-architecture.md` §3.

## Deliverables

### `app/utilities/logging_utils.py`

- `configure_logging()` — attaches a JSON formatter to the root logger; writes to `logs/app.log` and stdout. One JSON object per line.
- `request_id_var: ContextVar[str]` — set once per incoming request (by the agent controller, #16); every log line pulls the current value.
- `new_request_id() -> str` — returns a UUID4 string.

### `log_llm_call(...)` — one JSON line, fields per §3
```
request_id, loop_iteration, model,
prompt_tokens, completion_tokens, total_tokens,
latency_ms, cost_usd, attempt_number,
success (bool), error (str|null), timestamp
```

### `log_tool_call(...)` — one JSON line, fields per §3
```
request_id, loop_iteration, tool_name,
args (redact sensitive fields),
attempt_number, latency_ms,
success (bool), error (str|null), timestamp
```

### `log_session_event(event, session_id, request_id, is_new)`
- Distinct milestone log: `event` = `"session_start"` (new) or `"session_resume"` (existing)
- Includes `session_id`, `request_id`, `is_new`
- This is the anchor line for tracing a full request by `request_id`.

## Rules
- Every logging call is wrapped defensively — a logging failure must never crash the request.
- `cost_usd` is always present (log `0.0` explicitly on a free tier, never omit).
- Redaction helper: any arg field name matching a sensitive pattern is replaced with `"[REDACTED]"` before logging.
