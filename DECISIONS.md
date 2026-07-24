# Architecture Decisions

## 1. Idempotency on internal retries
- **Decision:** check-before-write is the only idempotency mechanism — no idempotency-key system. `insert_real_estate`/`insert_campaign` call `Repository.exists(id)` immediately before the `INSERT`; `update_*`/`delete_*` call `Repository.exists(id)` immediately before the `UPDATE`/`DELETE`. This check-then-act sequence, plus the write's own `UNIQUE` constraint on the primary key, runs *inside* the same `run_with_retry` attempt as the write itself.
- **Alternatives considered:**
  - A generated idempotency key per LLM tool call, deduplicated server-side — rejected as over-engineering for a local SQLite store with no network partition risk; the failure modes an idempotency key protects against (client retries after a dropped response, distributed duplicate submission) don't apply here.
  - No check at all, relying on the `UNIQUE`/PK constraint to reject duplicate inserts — rejected because that alone can't distinguish "attempt 1 already succeeded" from "attempt 1 genuinely failed for another reason," and gives update/delete no way to fail fast with a clear message before touching the DB twice.
- **Rationale:** at this scale (single-process, single local SQLite file, no concurrent writers), check-before-write is sufficient and keeps every tool's internal retry loop uniform — a repeated attempt against unchanged state always produces the same outcome (already-exists / not-found), so retrying never double-applies a write.

## 2. Row limits on read tools
- **Decision:** `RealEstateFilters.limit`/`CampaignFilters.limit` default to `20`; `query_real_estate`/`query_campaigns` additionally clamp the *effective* limit to a hard server-side ceiling of `50` (`MAX_QUERY_LIMIT` in each tools module) regardless of what the caller requests — `min(filters.limit, MAX_QUERY_LIMIT)`.
- **Alternatives considered:**
  - Rejecting (validation error) any `limit > 50` instead of silently clamping — rejected because it wastes a tool-call round trip on something the tool can trivially satisfy itself; clamping still returns a useful, bounded result.
  - No hard ceiling, trusting the model-side default of 20 — rejected: nothing stops the LLM from passing `limit=10000`, and an unbounded result dumped back into the LLM context is one of the largest avoidable sources of slow, expensive next-step calls.
- **Rationale:** latency/cost is the primary constraint on this loop (`MAX_STEPS`-bounded, per-call token cost logged); a small, predictable row cap keeps every tool response cheap to feed back into the next planner call.

## 3. Write-scope safety
- **Decision:** `update_real_estate`/`delete_real_estate` and `update_campaign`/`delete_campaign` only ever accept an exact `listing_id`/`campaign_id` — their Pydantic input models (`RealEstateUpdate`/`RealEstateDelete`/`CampaignUpdate`/`CampaignDelete`) have no filter-shaped fields (no `city`, `state`, `channel`, etc.) at all, so a broad "delete all X" request is a schema validation failure, not a possible call shape.
- **Alternatives considered:**
  - Accepting a filter and translating it to a `WHERE` clause for bulk update/delete — rejected outright: this is the exact mistake the architecture doc calls out as causing real data loss from an ambiguous natural-language request, and there's no legitimate use case for it in this tool set.
- **Rationale:** making broad writes structurally impossible (rather than "discouraged by convention") means neither the LLM nor a bug in prompt-following can accidentally trigger one — the type system itself is the guardrail.

## 4. Per-call timeout
- **Decision:** use SQLite's own connection-level busy-timeout — `get_connection(timeout=settings.tool_timeout_seconds)` (`TOOL_TIMEOUT_SECONDS`, default `5.0`s) — rather than a generic thread-based timeout wrapper. A call that can't acquire a lock within the window raises `sqlite3.OperationalError`, which flows through the tool's existing `run_with_retry` loop like any other failure.
- **Alternatives considered:**
  - Running each repository call in a worker thread and bounding it with `.join(timeout)` — rejected: `sqlite3.Connection` objects aren't safe to use across threads by default (`check_same_thread=True`), and the test suite deliberately shares one in-memory connection across every repository call for the lifetime of a test (`tests/conftest.py`); a thread-based timeout would either break that shared-connection test harness or require weakening `check_same_thread`, adding real cross-thread-safety risk for no benefit on a local, single-writer SQLite file.
  - No timeout at all, given SQLite's low hang risk locally — rejected as a silent gap: the architecture doc explicitly calls out lock contention as the scenario to guard against, and SQLite already ships a purpose-built mechanism for exactly that.
- **Rationale:** the busy-timeout is the idiomatic, zero-risk way to bound *the specific failure mode SQLite can actually have* (lock contention), it requires no threading, and it needed only a one-line addition to `db/database.py`'s `get_connection()`.

## 5. LLM provider & factory design
- **Decision:** Gemini (`gemini-3.1-flash-lite`, via the current `google-genai` SDK) is the only LLM provider actually wired up. Access goes through an `LLMProviderClient` abstract base plus a `get_llm_client(provider)` registry (`app/agent/llm_factory.py`), and `app/agent/llm_client.py`'s `call_llm(...)` is the only caller — it never talks to a provider SDK directly.
- **Alternatives considered:**
  - Hardcoding Anthropic, as the original scaffold draft listed — rejected: no key/requirement for it, and it would have meant shipping an untested integration.
  - Wiring up 2-3 providers (Gemini + Anthropic + OpenAI) up front — rejected as premature: without real keys for the others, that code would be unexercised and untested, adding risk without adding value.
  - A generic single `LLM_API_KEY` env var reused across whichever provider is active — rejected in favor of provider-specific key vars (`GEMINI_API_KEY`, etc.) so multiple providers can be configured side by side later without one overwriting another.
- **Rationale:** the factory/registry pattern keeps every call site (planner, loop controller) provider-agnostic — they only ever see `LLMResponse`/`LLMCallError`, never a provider SDK type. Adding a second provider later is a new `LLMProviderClient` subclass and one registry entry, not a change to any existing call site. Gemini's cheapest current GA tier (`gemini-3.1-flash-lite`, $0.25 / $1.50 per 1M tokens) was chosen to minimize `cost_usd` for a latency- and cost-sensitive tool-calling loop.
