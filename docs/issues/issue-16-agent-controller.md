# Issue #16 — Agent controller

**Labels:** `controllers`
**Depends on:** #5, #15

## Task
Implement `app/controllers/agent_controller.py` per `docs/agent-architecture.md` §0 and §2.

## Deliverables

### `handle_message(session_id: str | None, message: str) -> dict`
1. **Syntax validation** — reject if: empty, exceeds 4000 chars, not valid UTF-8. Return `{"error": "...", "status": 400}`.
2. **PII/secret scan** — call `security.scan_for_sensitive_data(message)`. If non-`None`:
   - Log a security-event line: `{event: "security_reject", pattern_type: <type>, request_id: <new uuid>}` — pattern type only, never the matched value.
   - Return `{"error": "request contains data that can't be processed", "status": 400}`.
3. **Generate `request_id`** — `new_request_id()` from #4; set `request_id_var`.
4. **Run loop** — `answer = loop_controller.run(session_id, message, request_id)`.
5. **Return** — `{"answer": answer, "session_id": session_id, "status": 200}`.

## Rules
- Security check runs once here; the agent and tools never re-check.
- Never echo back a detected secret in any response or log.
- `request_id` is generated here and threaded through all downstream log lines via `request_id_var`.

## Tests
- Empty message → 400.
- Message with email → 400, security-event logged, secret not in response.
- Clean message → calls loop controller, returns answer.
