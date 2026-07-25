# 📊 AI Excel Assistant — Junior AI Engineer Task

An AI-powered conversational assistant that reads, queries, inserts, modifies, and deletes data from Excel files (`Real Estate Listings.xlsx` and `Marketing Campaigns.xlsx`) using custom ReAct-style tools built **strictly from scratch** in Python (no LangChain, LlamaIndex, AutoGen, or CrewAI).

This is a monorepo split into a Python/FastAPI **backend**, a React/Vite **frontend**, and top-level **docs**. See [`DESIGN.md`](DESIGN.md) for the high-level system design and how the pieces fit together.

---

## 📁 Repository Layout

```text
.
├── backend/              # FastAPI app, ReAct agent loop, SQLite data layer, tests
│   └── README.md         # Backend-specific setup, run & test instructions
├── frontend/              # React (Vite) chat UI
│   └── README.md         # Frontend-specific setup & run instructions
├── docs/                  # Product & architecture documentation
│   ├── PRD.md             # Product Requirements Document & Mermaid workflows
│   ├── TECHNICAL_SPEC.md  # Early technical spec draft (superseded by DESIGN.md/agent-architecture.md)
│   ├── agent-architecture.md # Authoritative agent runtime spec (planner/executor/loop/tools)
│   └── issues/            # Historical per-feature implementation tickets
├── README.md              # You are here — project overview & quick start
├── DESIGN.md               # High-level system design (start here for architecture)
└── DECISIONS.md            # Architecture decisions & trade-offs log
```

Each part of the repo owns its own setup instructions — this file only covers
the fastest path to running the whole stack locally. For details, see
[`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

---

## ⚡ Quick Start & Run Guide

### 1. Prerequisites
- **Python 3.10+** and **Node.js 18+** installed
- Git

### 2. Clone & Set Up the Backend

```bash
# Clone the repository
git clone <your-github-repo-url>
cd Junior-AI-Engineer-Task

# Create & activate a virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# All backend commands run from backend/ from here on
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Windows (PowerShell):
Copy-Item .env.example .env
# macOS / Linux:
cp .env.example .env
```

*(Optional)* Set your free Groq API key inside `backend/.env`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_free_groq_api_key_here
```

### 4. Initialize & Seed the SQLite Database

```bash
python -m db.seed_database
```

### 5. Run the Backend

```bash
uvicorn main:app --reload --port 8000
```

- 🔌 **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🟢 **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 6. Run the Frontend (in a separate terminal)

```bash
cd frontend
npm install
npm run dev
```

- 🌐 **Chat UI**: [http://localhost:3000](http://localhost:3000)

See [`frontend/README.md`](frontend/README.md) for how to point the UI at a different backend URL.

---

## 💬 Example Natural Language Queries

Try asking the assistant queries like:

### 🏠 Real Estate Dataset (`LST-XXXX`)
- **Query**: `"Show all houses in Illinois under $400,000"`
- **Insert**: `"Add a new property: 4 bed, 3.5 bath house in Austin, Texas listed for $650,000"`
- **Update**: `"Update listing LST-5001 status to Sold and set sale price to $360,000"`
- **Delete**: `"Delete listing LST-5002"`
- **Aggregate**: `"What is the average listing price by state?"`

### 📈 Marketing Campaigns Dataset (`CMP-XXXX`)
- **Query**: `"Which campaign generated the highest revenue?"`
- **Insert**: `"Create a new campaign named 'Fall Sale' on Facebook with budget $15,000"`
- **Update**: `"Change the budget allocated for CMP-8001 to $30,000"`
- **Delete**: `"Delete campaign CMP-8003"`
- **Aggregate**: `"Calculate the total amount spent across all channels"`

---

## 📚 Project Documentation

- [🗺️ System Design (DESIGN.md)](DESIGN.md) — start here for the big picture
- [🧠 Agent Architecture](docs/agent-architecture.md) — planner/executor/loop, logging, tool inventory
- [📄 Product Requirements Document (PRD)](docs/PRD.md)
- [🧾 Architectural Decisions & Trade-offs](DECISIONS.md)
- [🖥️ Backend README](backend/README.md)
- [🎨 Frontend README](frontend/README.md)

---

## 🧪 Running Tests

```bash
cd backend
pytest
```
