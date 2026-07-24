# Agency AI Frontend — Framer Design System

A React application built with **Vite**, **Tailwind CSS**, **Lucide Icons**, and **Shadcn/UI components** implementing Framer's near-pure black marketing & dashboard design system.

The frontend consumes the exact same backend endpoints (`/api/health`, `/api/sessions/`, etc.) that the Gradio UI in `ui/api_client.py` connects to.

---

## 🎨 Framer Design System Highlights

- **Near-Pure Black Canvas (`#050505`)**: Dark-only surface across hero, sessions, diagnostics, and footer.
- **Massive Display Tracking**: Poster-grade headlines (`-5.5px` / `-4.25px` letter-spacing) using Inter variable typography with OpenType character variants (`cv01`, `cv05`, `cv09`, `cv11`, `ss03`, `ss07`, `dlig`, `tnum`).
- **Sky Blue Chromatic Accent (`#0099FF`)**: Reserved strictly for hyperlinks, active indicators, and input focus rings (`rgba(0,153,255,0.5)`). Never used as a background button fill.
- **White Pill CTAs (`button-primary`)**: Pure white pill buttons with black typography for primary CTAs (`rounded-pill`).
- **Charcoal Secondary Pills (`button-secondary`)**: Dark charcoal pills (`#121212`) for secondary actions.
- **Atmospheric Gradient Spotlight Cards**: Signature glowing showcase tiles (Violet, Magenta, Sunset Orange, Coral) with 30px (`rounded-[30px]`) corners inside dark grids.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Dev Server

```bash
npm run dev
```

The app will launch at `http://localhost:3000`.

---

## 🔗 Backend API Integration

By default, the React app communicates with the local FastAPI server running on `http://127.0.0.1:8000`.

Available endpoints:
- `GET /api/health` — Backend health status & latency
- `GET /api/sessions/` — List all chat sessions
- `POST /api/sessions/` — Create new chat session (`{"session_name": "..."}`)
- `DELETE /api/sessions/{session_id}` — Delete chat session by ID

You can dynamically change the API Base URL inside the app by clicking the **Settings (⚙️)** button in the top navigation bar.

---

## 📁 File Structure

```
frontend/
├── index.html               # Main HTML entry with Google Fonts
├── package.json             # React + Vite + Tailwind dependencies
├── vite.config.js           # Vite config & API proxy configuration
├── tailwind.config.js       # Framer design system tokens
├── postcss.config.js        # PostCSS setup
└── src/
    ├── index.css            # Framer gradient cards & font feature settings
    ├── main.jsx             # React DOM root
    ├── App.jsx              # Main Dashboard app container
    ├── lib/
    │   ├── api.js           # HTTP Client for FastAPI endpoints
    │   └── utils.js         # Tailwind cn helper & formatters
    └── components/
        ├── TopNav.jsx       # Sticky header with API status pulse & settings
        ├── Hero.jsx         # Poster headline & quick metric tiles
        ├── SessionManager.jsx # Interactive session CRUD dashboard
        ├── AgentSpotlights.jsx # 4 Atmospheric gradient showcase cards
        ├── ApiDiagnostics.jsx # Live payload inspector & route tester
        ├── Footer.jsx       # Framer monochrome footer
        └── ui/              # Shadcn / Framer design system UI components
            ├── Button.jsx   # White pill, charcoal pill, translucent, circular icon
            ├── Input.jsx    # Text input with sky-blue focus halo
            ├── Card.jsx     # Surface-1 and Surface-2 cards
            ├── SpotlightCard.jsx # Atmospheric gradient spotlight card wrapper
            ├── Badge.jsx    # Micro chips & status indicators
             font-mono text-emerald-400
```
