# 📊 AI Excel Assistant — Junior AI Engineer Task

An AI-powered conversational assistant that reads, queries, inserts, modifies, and deletes data from Excel files (`Real Estate Listings.xlsx` and `Marketing Campaigns.xlsx`) using custom ReAct-style tools built **strictly from scratch** in Python (no LangChain, LlamaIndex, AutoGen, or CrewAI).

---

## ⚡ Quick Start & Run Guide

### 1. Prerequisites
- **Python 3.10+** installed
- Git

### 2. Clone & Setup Virtual Environment

```bash
# Clone the repository
git clone <your-github-repo-url>
cd Junior-AI-Engineer-Task

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the `.env.example` template to `.env`:

```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

*(Optional)* Set your free LLM API key (e.g. Groq, Gemini) inside `.env` if required by your setup:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_free_groq_api_key_here
```

### 5. Initialize & Seed SQLite Database

Run the seeder script to apply database migrations and populate SQLite tables from the Excel files:

```bash
python -m db.seed_database
```

### 6. Run the Application

Launch the FastAPI backend along with the integrated Gradio Web UI:

```bash
uvicorn main:app --reload --port 8000
```

Once running, access the interfaces in your browser:
- 🌐 **Gradio Web UI**: [http://localhost:8000/ui](http://localhost:8000/ui)
- 🔌 **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🟢 **API Health Check**: [http://localhost:8000/](http://localhost:8000/)

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

## 📁 Directory Structure

```text
.
├── app/
│   ├── controllers/      # REST API route handlers
│   ├── services/         # ReAct Agent loop, LLM adapter & business logic
│   ├── repositories/     # SQLite Data access layer (Real Estate, Marketing, Chat Session)
│   ├── models/           # Data schemas & validation models (Pydantic DTOs)
│   └── utilities/        # Query filter evaluators & response formatting
├── config/               # Logging, limiter & environment settings
├── data/                 # Data directory containing Excel source files
│   ├── Real Estate Listings.xlsx
│   └── Marketing Campaigns.xlsx
├── db/                   # Database layer (SQLite migrations, connection factory & seeder)
│   ├── app.db            # Generated SQLite database file
│   ├── database.py       # Connection factory and migration runner
│   ├── seed_database.py  # Seeder script parsing Excel files into SQLite
│   └── migrations/       # SQL migration scripts
├── docs/                 # Full documentation
│   ├── PRD.md            # Product Requirements Document & Mermaid Workflows
│   └── TECHNICAL_SPEC.md # Architecture & ReAct Sequence Diagrams
├── routes/               # API Router configuration
├── ui/                   # Gradio Web Interface component
├── main.py               # Application entry point (FastAPI + Gradio)
├── requirements.txt      # Pinned dependencies
├── .env.example          # Environment variables template
└── DECISIONS.md          # Architectural decisions and trade-offs
```

---

## 📚 Project Documentation

For deeper details regarding architecture, design choices, and flowcharts:
- [📄 Product Requirements Document (PRD)](docs/PRD.md)
- [🛠️ Technical Specifications & Diagrams](docs/TECHNICAL_SPEC.md)
- [🧠 Architectural Decisions & Tradeoffs](DECISIONS.md)

---

## 🧪 Running Tests

To run the automated backend test suite:

```bash
pytest
```
