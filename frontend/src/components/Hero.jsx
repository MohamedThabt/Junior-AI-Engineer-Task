import React from "react"
import { Cpu, ArrowRight, Zap, ShieldCheck, Database, Layers } from "lucide-react"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"

export const Hero = ({ onOpenCreateSession, sessionCount, isHealthy, latency }) => {
  return (
    <section className="relative pt-16 pb-14 px-4 sm:px-6 lg:px-8 border-b border-hairline overflow-hidden">
      {/* Background dark grid background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface-1 border border-white/10 text-xs text-ink-muted mb-8 shadow-sm">
          <Badge variant="sky">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-ping" />
            LIVE AGENT INTERFACE
          </Badge>
          <span className="text-white/40">|</span>
          <span className="text-ink">Gradio Compatible API Client</span>
        </div>

        {/* Display XXL Poster Headline with Framer negative letter spacing */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-medium tracking-display-xl lg:tracking-display-xxl text-white leading-display-xl lg:leading-display-xxl mb-6 select-none">
          REAL ESTATE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
            INTELLIGENCE
          </span>
        </h1>

        {/* Lead body text */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-ink-muted tracking-body-lg leading-body-lg mb-10 font-normal">
          High-performance AI agent operating system for real estate listings, market search tools, execution plans, and interactive session management.
        </p>

        {/* Primary White Pill CTA & Secondary Charcoal Pill CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenCreateSession}
            className="w-full sm:w-auto shadow-framer-drop"
          >
            Create Chat Session
            <ArrowRight className="w-4 h-4 ml-2 text-black" />
          </Button>

          <a href="#sessions-section" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Browse Active Sessions ({sessionCount})
            </Button>
          </a>
        </div>

        {/* Quick metrics bar - Surface 1 card with level-2 light edge */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface-1/80 border border-white/10 backdrop-blur-md text-left card-light-edge">
          <div className="p-3 border-r border-white/5 last:border-0">
            <div className="flex items-center text-xs text-ink-muted mb-1">
              <Database className="w-3.5 h-3.5 mr-1.5 text-accent-blue" />
              Active Sessions
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{sessionCount}</div>
            <p className="text-[11px] text-ink-muted mt-0.5">Persisted SQLite</p>
          </div>

          <div className="p-3 border-r border-white/5 last:border-0">
            <div className="flex items-center text-xs text-ink-muted mb-1">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              API Health
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {isHealthy ? "ONLINE" : "OFFLINE"}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">FastAPI Backend</p>
          </div>

          <div className="p-3 border-r border-white/5 last:border-0">
            <div className="flex items-center text-xs text-ink-muted mb-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Response Time
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {latency > 0 ? `${latency}ms` : "--"}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">Roundtrip latency</p>
          </div>

          <div className="p-3">
            <div className="flex items-center text-xs text-ink-muted mb-1">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Agent Architecture
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">LangGraph</div>
            <p className="text-[11px] text-ink-muted mt-0.5">Executor + Planner</p>
          </div>
        </div>

      </div>
    </section>
  )
}
