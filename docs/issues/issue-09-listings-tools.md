# Issue #9 — Listings tools

**Labels:** `tools`
**Depends on:** #3, #4, #6

## Task
Implement `app/tools/listings_tools.py` per `docs/agent-architecture.md` §6, §7, §7.1.

## Deliverables (4 tools)

| Tool | Repository method | Notes |
|---|---|---|
| `query_listings(args) -> ToolResult` | `ListingRepository.query()` | `limit` capped server-side at **50** regardless of requested value |
| `insert_listing(args) -> ToolResult` | `ListingRepository.insert()` | check-before-write: verify `listing_id` does NOT already exist |
| `update_listing(args) -> ToolResult` | `ListingRepository.update()` | exact PK only; verify record exists before updating |
| `delete_listing(args) -> ToolResult` | `ListingRepository.delete()` | exact PK only; verify record exists before deleting |

## Per-tool operational contract (§7.1) — applies to all four
1. Validate input with the matching Pydantic model (#3) **first**, before touching the repository.
2. Delegate the DB op to the repository method — **no raw SQL in this file**.
3. Wrap the repository call in `try/except`; retry up to **2 times** internally (the tool owns its retry loop).
4. On final failure, return a `ToolResult(success=False, ...)` with a plain-language message naming *this tool* and why it failed (e.g. `"update_listing failed after 2 attempts: listing_id 'LST-9999' not found"`).
5. Call `log_tool_call(...)` in a `finally` block on every attempt.

## Rules (§7)
- One responsibility per tool — one verb, one table.
- Tools never think: no LLM calls, no fuzzy matching, no NL formatting.
- Write-scope safety: update/delete operate on exact PK only, never a filter.
- Deterministic relative to DB state.
- Every return is the `ToolResult` envelope — never a raw string or bare exception.

## Tests
- Each tool callable standalone (no agent code) with a seeded test DB.
- Validation failure → structured error, repository never called.
- update/delete on a missing id → error naming the tool.
- `query_listings` with `limit=1000` returns ≤ 50 rows.
