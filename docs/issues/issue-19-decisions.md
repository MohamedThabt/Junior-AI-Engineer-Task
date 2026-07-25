# Issue #19 — DECISIONS.md

**Labels:** `docs`
**Depends on:** #18

## Task
Fill in `DECISIONS.md` with the four explicit architectural decisions called out in `docs/agent-architecture.md` §7.3. One entry per decision, each with: the decision made, the alternatives considered, and the rationale.

## Deliverables

### Decision 1 — Idempotency on internal retries
- **Decision:** check-before-write on every insert (verify PK does not exist immediately before inserting).
- **Why:** if a write succeeds but the confirmation is lost, a naive retry would double-insert. Check-before-write detects this without a full idempotency-key system.
- **Why not a full idempotency-key system:** local SQLite has a very low failure surface; the added complexity is not justified at this scope.

### Decision 2 — Row limits on read tools
- **Decision:** `query_listings` and `query_campaigns` cap returned rows at **50** server-side, regardless of what the LLM requests.
- **Why:** an unbounded query result dumped into the LLM context is the single biggest avoidable source of slow, expensive next-loop-iteration calls. 50 rows covers all realistic single-request use cases.

### Decision 3 — Write-scope safety
- **Decision:** `update_*` and `delete_*` tools accept only an exact primary key (`listing_id` / `campaign_id`). Filter-based bulk mutations are not supported.
- **Why:** an ambiguous natural-language request (e.g. "delete all pending listings in Texas") must never silently destroy multiple records. Requiring an exact PK forces the LLM to confirm the specific record first.

### Decision 4 — Per-call timeout
- **Decision:** each tool's repository call is wrapped with a **5-second timeout**. A timeout counts as a failure and triggers the normal retry/error path.
- **Why:** a hung DB call (lock contention, etc.) must not block the entire loop indefinitely. 5 s is generous for local SQLite while still bounding worst-case latency per loop iteration.
