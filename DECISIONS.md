# Architecture Decisions


## Major Decisions

### 1. SQLite over Excel
**Decision:** All persistent data is stored in SQLite (`db/app.db`); Excel files are used only as a one-time seed source.
- SQLite provides atomic commits/rollbacks on every write; Excel has no crash-safe write guarantee — a mid-save crash can corrupt the entire workbook.
- SQLite touches only affected pages per operation; Excel must deserialize/serialize the entire workbook even for a single-cell change, compounding cost as data grows.
- SQLite's busy-timeout serializes concurrent writers cleanly; `openpyxl` has no locking primitive, so two simultaneous writes produce silent data loss.
- Indexed point lookups take microseconds in SQLite; an equivalent Excel round-trip takes tens–hundreds of milliseconds regardless of change size.

### 2. Repository layer separated from tool layer
**Decision:** All data access lives in `app/repositories/`; tools in `app/tools/` call repositories and never touch the DB directly.
- Error handling, validation, and logging for the data access layer are centralized in one place, not scattered across every tool.
- No ORM is needed — there are no relations between entities, so raw SQL via the repository is sufficient and simpler.
- Tool logic stays focused on input parsing and response shaping; repository logic stays focused on DB correctness and retry semantics.
- Each layer can be tested independently; a tool test can mock the repository without touching SQLite at all.

### 3. Migrations over raw SQL scripts
**Decision:** Schema changes are applied via versioned migration files, not ad-hoc SQL scripts run manually.
- Migrations are ordered and tracked, so the schema version is always known and reproducible across environments.
- Raw SQL scripts have no built-in mechanism to detect whether they've already been applied, risking double-execution.
- A migration runner makes CI/CD schema upgrades automatic; manual scripts require human coordination and are error-prone.
- Rolling back a bad change is explicit (down migration) rather than requiring hand-written reverse SQL.

### 4. Pydantic models as the single source of truth for tool schemas

**Decision:** Every tool's input validation model (`RealEstateFilters`, `CampaignCreate`, etc.) in `app/models/schemas.py` is also the source for the LLM function-calling schema passed to the provider (`TOOL_SCHEMAS` in `app/tools/registry.py` via `model.model_json_schema()`).

- A single definition means the validation rules the backend enforces and the schema the LLM sees can never drift apart — adding a field or constraint in one place automatically propagates to the other.
- No hand-written JSON schemas to maintain; Pydantic's `model_json_schema()` generates them deterministically.
- The `_relax_numeric_params` post-processing step widens numeric fields to also accept strings in the advertised schema, working around Groq's strict tool-call validator that rejects quoted numbers even though Pydantic coerces them correctly on our side.

### 5. `finalize` as a control tool, not a special API response

**Decision:** The agent signals task completion by calling a `finalize` tool (with the answer as its argument) rather than by returning a specially-shaped message or a separate API field.

- Treating `finalize` as a tool keeps the agent loop uniform — every iteration is "call a tool or finalize"; there is no special-case branch for "the model decided it's done."
- The LLM's final answer is validated by `FinalizeInput` (Pydantic, `min_length=1`) before the loop exits, preventing empty or malformed answers from reaching the user.
- The loop controller can enforce a hard iteration cap and call `forced_finalize` / `graceful_fallback` when the cap is hit, without changing the tool interface.

### 6. Agent controller separated from the HTTP layer

**Decision:** `AgentController.handle_message()` is a plain Python function that returns a `dict` with an embedded `status` key; the FastAPI route layer translates that dict into an HTTP response.

- The controller is fully unit-testable without spinning up an HTTP server or mocking FastAPI internals.
- HTTP concerns (status codes, response models, exception handling) are confined to `routes/api.py`; business logic concerns (validation, PII scan, loop invocation) are confined to the controller.
- The same controller can be called from tests, CLI scripts, or a future WebSocket handler without any HTTP dependency.

### 7. PII / secret scanning at the controller boundary, before the agent loop

**Decision:** Every incoming message is scanned for PII and secrets (`scan_for_sensitive_data` in `app/utilities/security.py`) in the controller, before the agent loop or any tool ever runs. A match returns HTTP 400 with a generic error; the matched value is never logged.

- Blocking at the earliest possible point means sensitive data never enters the LLM context, the tool call chain, or the database.
- The scanner returns only the pattern type (`"api_key"`, `"email"`, etc.), never the matched value, so a logging bug or accidental re-raise cannot leak the secret.
- Centralising the check in the controller means tools and repositories never need to re-implement it.

### 8. Chat session context persisted in SQLite

**Decision:** Conversation history (the context list) is stored as a JSON-serialised column in the `chat_sessions` SQLite table, not in memory or a separate cache.

- Persistence means sessions survive backend restarts and container redeploys without any external cache service.
- A single SQLite volume (`db_data`) holds both domain data and session state, keeping the infrastructure footprint minimal.
- The context is deserialised on read and re-serialised on write; for the expected session sizes this is fast enough and avoids the complexity of a separate key-value store.

### 9. Rate limiting with slowapi at the ASGI middleware layer

**Decision:** Per-IP rate limiting is applied via `slowapi` middleware on the FastAPI app, not at the nginx or Traefik layer.

- Application-level rate limiting lets the limit be expressed in Python alongside the rest of the config and tested in unit/integration tests without a running proxy.
- `slowapi` integrates directly with FastAPI's exception handler system, so rate-limit errors return a consistent JSON error response matching the rest of the API.
- Traefik/nginx can add a second layer of protection at the edge if needed, but the application layer is the authoritative enforcer.

### 10. Deploy on Dokploy as a single Docker Compose stack behind Traefik + nginx

**Decision:** The full stack (FastAPI backend + React frontend) is deployed as one Docker Compose project on a single VPS via [Dokploy](https://dokploy.com), with two proxy layers: Traefik (Dokploy's built-in edge proxy) in front, and nginx (inside the frontend container) as the internal `/api/` reverse proxy.

- A single Compose project means one `docker compose up` / one Dokploy redeploy covers the entire stack — no separate CI pipelines or orchestration needed for a project of this scale.
- Dokploy ships Traefik pre-configured; it handles TLS termination (Let's Encrypt), HTTP→HTTPS redirect, and domain routing without any manual certificate management.
- The backend container is never exposed to the internet. nginx inside the frontend container proxies `/api/*` to `backend:8000` on the internal Compose network, so the attack surface is limited to a single public port (443 via Traefik).
- nginx also serves the React SPA with correct `try_files` fallback for client-side routing — combining static file serving and API proxying in one container avoids a third service.
- See `docs/DEPLOYMENT.md` for the full traffic diagram and step-by-step setup.

> There are many more deployment-related decisions captured in `docs/DEPLOYMENT.md` (volume strategy, env-var management, DNS setup, update flow). This entry records only the top-level architectural choice.

### 11. React + Vite over Gradio for the frontend

**Decision:** The user-facing UI is built with React (Vite + Tailwind + lucide-react) rather than Gradio, even though both consume the same FastAPI backend.

- Both options talk to the same FastAPI API, so the backend is identical either way — the choice is purely about the UI layer.
- Gradio is optimised for rapid ML demos with a fixed component palette; it provides little control over layout, interaction patterns, or visual design beyond its built-in widgets.
- React gives full control over component composition, state management, and styling, enabling a purpose-built UX (custom chat layout, file upload flow, table rendering, loading states) that would be impossible or very awkward to achieve in Gradio.
- Vite's dev server with HMR keeps the frontend iteration loop fast; the production build is a static asset bundle that nginx serves with zero runtime overhead.
- Tailwind + lucide-react keeps the dependency footprint small while still producing a polished, accessible UI.
- The trade-off is more boilerplate than Gradio for a pure demo, but for a production-quality tool the flexibility and UX ceiling of React far outweigh the setup cost.

### 12. LLM provider factory + multiple Groq API keys with round-robin rotation
**Decision:** All LLM access goes through an `LLMProviderClient` abstract base and `get_llm_client()` registry (`llm_factory.py`); `GroqClient` holds a key pool (`GROQ_API_KEY` + `GROQ_API_KEYS`) and rotates round-robin on `RateLimitError`, cycling every key at most once before re-raising.
- The factory/registry keeps every call site provider-agnostic — callers only ever see `LLMResponse`/`LLMCallError`, never a provider SDK type; adding a second provider is a new subclass and one registry entry, not a change to any existing call site.
- Provider-specific key vars (`GROQ_API_KEY`, etc.) allow multiple providers to be configured side by side without one overwriting another.
- Rotating across a key pool on rate-limit converts a hard quota-exhaustion failure (and a wasted multi-attempt retry loop) into a transparent continuation of the current loop iteration with zero changes to callers.
- Round-robin distribution is deterministic and even, making log traces easier to follow than a random shuffle; each rotation is logged at `WARNING` level for observability.
- Backoff-retrying the same exhausted key (the alternative) burns time without any chance of success until the quota window resets.
