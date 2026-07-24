# Issue #3 — Pydantic schemas

**Labels:** `models`
**Depends on:** #1

## Task
Implement `app/models/schemas.py` per `docs/agent-architecture.md` §7.2.

## Deliverables

### `ToolResult` — standard result envelope (all tools)
```python
class ToolResult(BaseModel):
    success: bool
    data: dict | list | None
    error: str | None
    tool: str
    attempts: int
```

### Tool input models (Pydantic, with business-rule validators)

**Listings:**
- `ListingFilters` — optional: `city`, `state`, `listing_status` (∈ {Active,Pending,Sold}), `min_price`, `max_price`, `min_bedrooms`, `max_bedrooms`, `min_bathrooms`, `max_bathrooms`; plus `limit: int = 20`
- `ListingCreate` — all listing columns; `bedrooms >= 0`, `bathrooms >= 0`, `square_footage > 0`, `list_price >= 0`, `listing_status` enum, `listing_id` matches `^LST-\d+$`
- `ListingUpdate` — `listing_id` (required, `^LST-\d+$`) + all other fields optional; at least one field-to-change required
- `ListingDelete` — `listing_id` (required, `^LST-\d+$`)

**Campaigns:**
- `CampaignFilters` — optional: `channel`, `campaign_name`, `start_date_from`, `end_date_to`; plus `limit: int = 20`
- `CampaignCreate` — all campaign columns; `campaign_id` matches `^CMP-\d+$`; `start_date`/`end_date` valid ISO `YYYY-MM-DD`; numeric fields `>= 0`
- `CampaignUpdate` — `campaign_id` (required, `^CMP-\d+$`) + optional fields; at least one required
- `CampaignDelete` — `campaign_id` (required, `^CMP-\d+$`)

**Control:**
- `FinalizeInput` — `answer: str` (non-empty)

### Session model
```python
class ChatSession(BaseModel):
    session_id: str
    session_name: str
    context: list
    created_at: str
    updated_at: str
```

## Notes
- Validators raise `ValidationError` on bad input — the executor (#13) catches this and turns it into a `ToolResult(success=False, ...)`.
- Keep these models the single source of truth for both tool validation and registry schema generation (#11).
