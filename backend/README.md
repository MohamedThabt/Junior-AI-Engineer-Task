# Backend — AI Excel Assistant

FastAPI backend implementing a from-scratch ReAct-style agent loop (planner →
executor → tools → repositories → SQLite), backed by data seeded from the two
Excel source files. No agent/orchestration frameworks (LangChain, LlamaIndex,
AutoGen, CrewAI) are used anywhere — see [`../docs/agent-architecture.md`](../docs/agent-architecture.md)
for the full runtime spec and [`../DESIGN.md`](../DESIGN.md) for how this fits
into the rest of the repo.

All commands below assume your **current working directory is `backend/`**.

---

## 1. Setup

```bash
# from the repo root, create/activate a venv once (shared by the whole repo)
python -m venv venv
# Windows (PowerShell): ..\venv\Scripts\Activate.ps1   (if already inside backend/)
# macOS / Linux:        source ../venv/bin/activate

cd backend
pip install -r requirements.txt
```

## 2. Configure Environment Variables

```bash
# Windows (PowerShell):
Copy-Item .env.example .env
# macOS / Linux:
cp .env.example .env
```

Key variables (see `.env.example` for the full, commented list):

| Variable | Default | Purpose |
|---|---|---|
| `MAX_STEPS` | `5` | Max planner/tool-call steps per request before forced finalize |
| `TOOL_TIMEOUT_SECONDS` | `5` | SQLite busy-timeout per tool call |
| `LLM_PROVIDER` | `groq` | Active LLM provider (registry in `app/agent/llm_factory.py`) |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Model name passed to the provider |
| `GROQ_API_KEY` | _(empty)_ | Free-tier Groq API key |
| `APP_LOG_LEVEL` | `INFO` | Root logger level |

## 3. Initialize & Seed the SQLite Database

Applies migrations under `db/migrations/` and loads both Excel files into
`db/app.db`:

```bash
python -m db.seed_database
```

## 4. Run the API

```bash
uvicorn main:app --reload --port 8000
```

- 🔌 Interactive docs: `http://localhost:8000/docs`
- 🟢 Health check: `http://localhost:8000/api/health`
- 💬 Agent chat: `POST http://localhost:8000/api/agent/chat`
- 🗂️ Sessions: `GET/DELETE http://localhost:8000/api/sessions/...`

## 5. Run Tests

```bash
pytest
```

Tests use an in-memory SQLite database (see `tests/conftest.py`) — they never
touch `db/app.db`.

---

## Directory Structure

```text
backend/
├── main.py                # FastAPI app entry point (CORS, middleware, lifespan/init_db)
├── routes/
│   └── api.py              # /api/health, /api/agent/chat, /api/sessions/*
├── app/
│   ├── controllers/        # Request-level orchestration (syntax + PII checks -> agent loop)
│   ├── agent/               # Planner, executor, loop controller, finalize, LLM client/factory
│   ├── tools/                # LLM-callable tools (query/insert/update/delete + finalize)
│   ├── repositories/         # SQLite data access (real estate, campaigns, chat sessions)
│   ├── models/               # Pydantic schemas (tool inputs/outputs, result envelopes)
│   └── utilities/             # Structured logging, PII/security scanning, retry helpers
├── config/                 # Settings (.env), logging setup, rate limiter, exception handlers
├── db/                     # Connection factory, SQL migrations, Excel seeder
│   └── migrations/
├── data/                   # Source Excel files consumed by the seeder
├── tests/                  # pytest suite, mirrors the app/ package layout
├── logs/                   # JSON log output (gitignored)
├── .env.example
└── requirements.txt
```

For the *why* behind this layout and the full request lifecycle (route →
controller → security scan → agent loop → tools → repositories), see
[`../docs/agent-architecture.md`](../docs/agent-architecture.md). For
trade-offs made along the way, see [`../DECISIONS.md`](../DECISIONS.md).
