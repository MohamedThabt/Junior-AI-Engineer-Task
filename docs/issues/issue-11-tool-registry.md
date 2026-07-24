# Issue #11 — Tool registry & finalize tool schema

**Labels:** `tools`
**Depends on:** #9, #10

## Task
Implement `app/tools/registry.py` and `app/tools/finalize_tool.py` per `docs/agent-architecture.md` §6 and §7.3.

## Deliverables

### `app/tools/registry.py`

**`TOOL_REGISTRY: dict[str, callable]`** — maps all 9 tool names to callables:
```
query_listings, insert_listing, update_listing, delete_listing,
query_campaigns, insert_campaign, update_campaign, delete_campaign,
finalize
```

**`TOOL_SCHEMAS: list[dict]`** — JSON-schema-style function-calling definitions for all 9 tools (this is what gets passed to the LLM). Each entry:
- `name`
- `description` (one line, action-oriented)
- `parameters` — JSON schema: property types, `required` array, enums where applicable (e.g. `listing_status`)

Derive parameter schemas from the Pydantic models in #3 where practical (e.g. `Model.model_json_schema()`) to keep schema and validation in sync.

### `app/tools/finalize_tool.py`
- Schema definition for `finalize`: single arg `answer: str` (required).
- **Schema only** — execution logic lives in `app/agent/finalize.py` (#12).

## Rules (§7.3 gap #1)
- Every tool has a machine-readable schema; the planner has no other way to call tools correctly.
- Registry is the single lookup the executor (#13) uses — tools are never imported/called directly elsewhere.

## Tests
- `TOOL_REGISTRY` has exactly 9 entries; every name has a matching schema in `TOOL_SCHEMAS`.
- Every schema validates as well-formed JSON schema.
