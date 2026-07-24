# Issue #18 — API routes & app entry point

**Labels:** `api`
**Depends on:** #16, #17

## Task
Implement `app/api/routes.py` and `main.py` per `docs/agent-architecture.md` §2.7 and §5.

## Deliverables

### `app/api/routes.py`

**`POST /agent/chat`**
- Request body: `{"session_id": str | null, "message": str}`
- Calls `AgentController.handle_message(session_id, message)`
- 200: `{"answer": str, "session_id": str}`
- 400: `{"error": str}` on validation or security rejection

**`GET /sessions`**
- Calls `SessionController.index()`
- 200: `[{session_id, session_name, created_at, updated_at}]`

**`GET /sessions/{session_id}`**
- Calls `SessionController.show(session_id)`
- 200: full session including `context`
- 404 if not found

**`DELETE /sessions/{session_id}`**
- Calls `SessionController.delete(session_id)`
- 204 on success
- 404 if not found

### `main.py`
- Creates the FastAPI app instance
- On startup: calls `run_migrations()` then `configure_logging()`
- Includes the router from `app/api/routes.py`
- Entry point: `uvicorn main:app`

## Tests
- `POST /agent/chat` with empty message → 400.
- `POST /agent/chat` with PII → 400, generic error message (no secret echoed).
- `GET /sessions` → list without context blobs.
- `GET /sessions/{id}` for missing id → 404.
- `DELETE /sessions/{id}` → 204; subsequent `GET` → 404.
