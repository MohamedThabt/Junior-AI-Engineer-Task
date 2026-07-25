# Issue #7 — LLM client wrapper

**Labels:** `agent`
**Depends on:** #3, #4

## Task
Implement `app/agent/llm_client.py` per `docs/agent-architecture.md` §2.5. Single choke point for every LLM API call.

## Deliverables

### `call_llm(messages: list, tools: list, model: str, loop_iteration: int) -> LLMResponse`
- Makes one LLM API call with the provided messages + tool schemas (function-calling).
- Wraps the HTTP call in `try/except`.
- Retries transient failures (network errors, rate limits, timeouts) up to **2 times** with exponential backoff (attempts 1, 2, 3).
- On **every attempt** (success or failure) calls `log_llm_call(...)` in a `finally` block — logs `attempt_number`, tokens, `latency_ms`, `cost_usd`, `success`, `error`.
- Computes `cost_usd` from `config/settings.PRICING` using the response's token counts.
- On all retries exhausted: raises typed `LLMCallError` (caught by loop controller #15 → graceful fallback).

### `LLMResponse` (dataclass or Pydantic)
- `raw` — provider response
- `tool_calls: list` — parsed `[{tool_name, args}]` (empty if none)
- `text: str | None`
- token counts: `prompt_tokens`, `completion_tokens`, `total_tokens`

### `LLMCallError(Exception)`
- Typed exception raised after retries exhausted.

## Rules
- Only place that calls the LLM SDK/HTTP directly.
- Planner (#14) never implements retry — it calls this.
- Backoff is bounded (e.g. 0.5s, 1s) — do not blow the latency budget.
