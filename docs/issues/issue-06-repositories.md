# Issue #6 — Repository layer

**Labels:** `db`, `repositories`
**Depends on:** #2, #3

## Task
Implement the three repositories per `docs/agent-architecture.md` §2.8 and §7.1. These own **all** SQL and transaction handling — no SQL exists anywhere else in the app.

## Deliverables

### `app/repositories/listing_repository.py` — `ListingRepository`
- `query(filters: dict, limit: int) -> list[dict]` — builds a parameterized `SELECT` from the provided filters (city, state, status, price range, beds/baths range); applies `LIMIT`
- `insert(data: dict) -> dict` — parameterized `INSERT`; returns the inserted row
- `update(listing_id: str, fields: dict) -> dict` — parameterized `UPDATE ... WHERE listing_id = ?`; returns updated row
- `delete(listing_id: str) -> None` — parameterized `DELETE ... WHERE listing_id = ?`
- `exists(listing_id: str) -> bool`

### `app/repositories/campaign_repository.py` — `CampaignRepository`
- Same four methods + `exists()` for `marketing_campaigns` (filters: channel, date range, campaign_name)

### `app/repositories/chat_session_repository.py` — `ChatSessionRepository`
- `get_or_create(session_id: str | None) -> ChatSession` — creates a new row (UUID id, default name, empty context, timestamps) if `session_id` is None or not found; returns whether it was new
- `save_context(session_id: str, context: list) -> None` — serializes context to JSON, updates `updated_at`
- `list_sessions() -> list[dict]` — id, name, created_at, updated_at (NOT the context blob)
- `get_session(session_id: str) -> ChatSession | None` — full row incl. context
- `delete_session(session_id: str) -> None` — hard delete

## Rules
- **All parameterized queries** — never string-interpolate values into SQL.
- Every write method wraps its statement in an explicit transaction: `BEGIN` → `COMMIT`, `ROLLBACK` on exception. Atomic and isolated.
- Repositories raise on DB error; the **tool** layer (#9/#10) owns retry/envelope — repositories do not.
- Use `get_connection()` from #2.

## Tests
- Round-trip insert → query → update → delete for each data repo.
- Session create → save_context → get_session → delete.
