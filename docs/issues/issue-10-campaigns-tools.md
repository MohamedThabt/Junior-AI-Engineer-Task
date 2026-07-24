# Issue #10 — Campaigns tools

**Labels:** `tools`
**Depends on:** #3, #4, #6

## Task
Implement `app/tools/campaigns_tools.py` per `docs/agent-architecture.md` §6, §7, §7.1.

## Deliverables (4 tools)

| Tool | Repository method | Notes |
|---|---|---|
| `query_campaigns(args) -> ToolResult` | `CampaignRepository.query()` | `limit` capped server-side at **50** |
| `insert_campaign(args) -> ToolResult` | `CampaignRepository.insert()` | check-before-write: verify `campaign_id` does NOT already exist |
| `update_campaign(args) -> ToolResult` | `CampaignRepository.update()` | exact PK only; verify record exists first |
| `delete_campaign(args) -> ToolResult` | `CampaignRepository.delete()` | exact PK only; verify record exists first |

## Per-tool operational contract (§7.1) — identical to Issue #9
1. Validate input with the matching Pydantic model (#3) first.
2. Delegate to the repository method — **no raw SQL**.
3. `try/except` + retry up to **2 times** internally.
4. On final failure, `ToolResult(success=False, ...)` naming *this tool* and the reason.
5. `log_tool_call(...)` in a `finally` block on every attempt.

## Rules (§7)
- One verb, one table. Tools never think. Write-scope = exact PK only.
- Standard `ToolResult` envelope on every path.

## Tests
- Each tool standalone against a seeded test DB.
- Validation failure → structured error, repository never called.
- update/delete on a missing id → error naming the tool.
- `query_campaigns` with an over-large `limit` returns ≤ 50 rows.
- Date-range filter validates ISO `YYYY-MM-DD`.
