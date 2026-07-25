# Issue #8 — System prompt

**Labels:** `agent`
**Depends on:** #1

## Task
Implement `app/agent/prompts.py` per `docs/agent-architecture.md` §4.

## Deliverables

### `build_system_prompt(max_loop_iterations: int) -> str`
Returns the full system prompt from §4 with `{max_loop_iterations}` interpolated at runtime, so the LLM's stated budget always matches the enforced limit.

### Content requirements (verbatim from §4)
- Role framing: "data assistant for a real estate and marketing analytics system", with the explicit "NO other data sources" constraint.
- **Both table schemas embedded** (all columns, types, example values) — this deliberately removes any "list/describe tables" tool round-trip.
  - `real_estate_listings`: listing_id, property_type, city, state, bedrooms, bathrooms, square_footage, year_built, list_price, sale_price (nullable), listing_status (Active/Pending/Sold)
  - `marketing_campaigns`: campaign_id, campaign_name, channel, start_date, end_date, budget_allocated, amount_spent, impressions, clicks, conversions, revenue_generated
- Tools summary line (read/insert/update/delete per table + `finalize`).
- The **5 rules** exactly as written in §4:
  1. Max `{max_loop_iterations}` loop iterations; don't look up what's already in the prompt.
  2. Call `finalize` only when you actually have the answer.
  3. Update/delete must target an exact id; ambiguous → clarify via `finalize`, never guess.
  4. On tool failure, read the error; don't blindly repeat the same call.
  5. Never fabricate data; empty result → say so plainly.

## Notes
- Keep the prompt as a module-level template string; only `{max_loop_iterations}` is interpolated.
- No business logic here.
