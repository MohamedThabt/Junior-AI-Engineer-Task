# Issue #17 — Session controller

**Labels:** `controllers`
**Depends on:** #6

## Task
Implement `app/controllers/session_controller.py` per `docs/agent-architecture.md` §2.7.

## Deliverables

### `index() -> list[dict]`
- Returns `[{session_id, session_name, created_at, updated_at}]` for all sessions.
- Does **not** include the `context` blob — keeps the listing response small.
- Calls `ChatSessionRepository.list_sessions()`.

### `show(session_id: str) -> dict | None`
- Returns the full session row including `context` (deserialized list).
- Calls `ChatSessionRepository.get_session(session_id)`.
- Returns `None` (→ 404 at route layer) if not found.

### `delete(session_id: str) -> None`
- Hard delete — no soft-delete or audit trail needed at this scope.
- Calls `ChatSessionRepository.delete_session(session_id)`.

## Rules
- No LLM or agent logic here — plain CRUD backed by the repository.
- Controllers do not call SQLite directly.

## Tests
- `index` returns list without context field.
- `show` returns full context for existing session; `None` for missing.
- `delete` removes the row; subsequent `show` returns `None`.
