# Documentation Index

Start at the top-level [`DESIGN.md`](../DESIGN.md) for the overall system map.
This folder holds the deeper, longer-form documentation:

| File | What it covers |
|---|---|
| [`agent-architecture.md`](agent-architecture.md) | **Authoritative** agent runtime spec — request flow, planner/executor/loop controller, logging, system prompt, tool inventory & design rules. Kept in sync with the actual `backend/` code. |
| [`PRD.md`](PRD.md) | Product Requirements Document — goals, scope, example user flows. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deployment guide — running the full stack on a small VPS with the Dokploy panel via Docker Compose. |
| [`TECHNICAL_SPEC.md`](TECHNICAL_SPEC.md) | Early technical spec drafted before implementation (Excel-direct repositories, different tool names). Superseded by `agent-architecture.md` and `DESIGN.md` — kept for historical context only. |
| [`issues/`](issues) | Historical per-feature implementation tickets (one per build step). File paths referenced inside predate the `backend/` restructuring — treat `agent-architecture.md` as the current source of truth for file locations. |

For *why* a given design choice was made over the alternatives, see the
top-level [`DECISIONS.md`](../DECISIONS.md).
