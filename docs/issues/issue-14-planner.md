# Issue #14 — Planner

**Labels:** `agent`
**Depends on:** #7, #8, #11

## Task
Implement `app/agent/planner.py` per `docs/agent-architecture.md` §2.1.

## Deliverables

### `PlannerDecision` (dataclass or Pydantic)
```python
# one of:
{"type": "tool_call", "tool_name": str, "args": dict}
{"type": "finalize", "answer": str}
```

### `plan(system_prompt: str, context: list, tool_schemas: list, loop_iteration: int) -> PlannerDecision`
- Builds the messages list: system prompt + context (prior tool calls/results this request) + current user message.
- Calls `llm_client.call_llm(messages, tools=tool_schemas, model=settings.LLM_MODEL, loop_iteration=loop_iteration)`.
- Parses the `LLMResponse`:
  - If the LLM returned a tool call named `finalize` → return `PlannerDecision(type="finalize", answer=args["answer"])`
  - If the LLM returned any other tool call → return `PlannerDecision(type="tool_call", tool_name=..., args=...)`
- Raises `LLMCallError` (from #7) on unrecoverable LLM failure — the loop controller catches this.

## Rules
- No retry logic here — retries live in `llm_client`.
- No database access, no business logic — decision only.
- Never calls tools directly; only produces a `PlannerDecision` for the executor.

## Tests
- LLM response with a data tool call → correct `PlannerDecision`.
- LLM response with `finalize` → `type="finalize"`.
- `LLMCallError` propagates unchanged.
