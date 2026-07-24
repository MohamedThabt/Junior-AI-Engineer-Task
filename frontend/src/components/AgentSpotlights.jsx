import React, { useState } from "react"
import { Cpu, Wrench, Sparkles, FileText, ArrowRight, Play, CheckCircle2, Shield, Database } from "lucide-react"
import { SpotlightCard } from "./ui/SpotlightCard"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { Input } from "./ui/Input"

export const AgentSpotlights = ({ activeSession }) => {
  const [promptInput, setPromptInput] = useState("Find 3 luxury 2-bedroom apartments in Cairo with balcony under 5M EGP")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [activeToolTab, setActiveToolTab] = useState("listings")

  const mockTools = [
    {
      id: "search_listings",
      name: "search_listings",
      category: "Real Estate",
      description: "Search property listings database by city, price range, bedrooms, and amenities.",
      params: ["location (str)", "max_price (float)", "min_bedrooms (int)"]
    },
    {
      id: "generate_campaign",
      name: "generate_campaign",
      category: "Marketing",
      description: "Generate targeted marketing copy and social media campaigns for real estate properties.",
      params: ["property_id (str)", "platform (str)", "target_audience (str)"]
    },
    {
      id: "process_excel",
      name: "process_excel",
      category: "Data Processing",
      description: "Analyze, filter, and extract insights from real estate Excel datasets.",
      params: ["file_path (str)", "filter_query (str)"]
    },
    {
      id: "session_context_sync",
      name: "session_context_sync",
      category: "System",
      description: "Synchronize agent execution state with persistent session database.",
      params: ["session_id (str)", "state_snapshot (dict)"]
    }
  ]

  const handleTestExecution = (e) => {
    e.preventDefault()
    if (!promptInput.trim()) return
    
    setIsExecuting(true)
    setExecutionResult(null)

    setTimeout(() => {
      setIsExecuting(false)
      setExecutionResult({
        status: "COMPLETED",
        node: "finalize_node",
        agent: "RealEstateAgent",
        steps: [
          { step: 1, tool: "search_listings", result: "Found 3 matching properties in New Cairo & Zamalek" },
          { step: 2, tool: "generate_campaign", result: "Generated 2 listing blurbs for Facebook & Instagram" },
          { step: 3, node: "finalize_node", result: "Synthesized recommendation summary into final response" }
        ],
        output: `Agent successfully processed request for session "${activeSession?.session_name || "Active Session"}". Found 3 top matching luxury apartments in Cairo with verified prices starting from 3,800,000 EGP.`
      })
    }, 1200)
  }

  return (
    <section id="spotlights-section" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-hairline">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <Badge variant="default" className="mb-3">
            Framer Atmosphere Showcase
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-medium tracking-display-lg text-ink">
            AI Agent Execution Architecture
          </h2>
          <p className="text-base text-ink-muted mt-2">
            Vibrant atmospheric gradient spotlight cards acting as showcase tiles inside the dark Framer canvas grid.
          </p>
        </div>

        {/* 2x2 Showcase Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Violet Spotlight Card */}
          <SpotlightCard
            variant="violet"
            badge="LANGGRAPH ENGINE"
            title="Agent Loop Controller"
            subtitle="Real-time control graph powering planner, tool execution, and state finalization nodes."
          >
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-xs text-white/80 pb-2 border-b border-white/10">
                <span className="flex items-center font-mono">
                  <Cpu className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                  Active Execution Graph
                </span>
                <span className="text-emerald-400 font-medium text-[11px]">READY</span>
              </div>

              {/* Node execution pipeline flow */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/50 uppercase font-mono">NODE 1</p>
                  <p className="font-semibold text-white mt-1">Planner</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40">
                  <p className="text-[10px] text-purple-300 uppercase font-mono">NODE 2</p>
                  <p className="font-semibold text-white mt-1">Executor</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/50 uppercase font-mono">NODE 3</p>
                  <p className="font-semibold text-white mt-1">Finalizer</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-white/60 flex items-center justify-between">
                <span>Session context: <strong className="text-white">{activeSession?.session_name || "Global Environment"}</strong></span>
                <span className="font-mono text-purple-300">max_iterations: 10</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 2: Magenta Spotlight Card */}
          <SpotlightCard
            variant="magenta"
            badge="TOOL REGISTRY"
            title="Listings & Tool Ecosystem"
            subtitle="Registered function tools available for dynamic invocation during agent planning."
          >
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/80 font-medium">Registered Tools (4)</span>
                <span className="text-[10px] text-pink-300 bg-pink-950/60 border border-pink-700/40 px-2 py-0.5 rounded-full">
                  Auto-validated
                </span>
              </div>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {mockTools.map((tool) => (
                  <div key={tool.id} className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between text-xs hover:border-pink-500/40 transition-colors">
                    <div>
                      <span className="font-mono text-white font-medium">{tool.name}</span>
                      <p className="text-[11px] text-white/60 line-clamp-1">{tool.description}</p>
                    </div>
                    <Badge variant="default" className="text-[10px] bg-white/10 text-white/90">
                      {tool.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>

          {/* Card 3: Sunset Orange Spotlight Card */}
          <SpotlightCard
            variant="orange"
            badge="PROMPT PLAYGROUND"
            title="Interactive Prompt Testbed"
            subtitle="Test real estate prompts and simulate multi-step tool calls directly."
          >
            <form onSubmit={handleTestExecution} className="space-y-3">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Agent Prompt Input
                </label>
                <div className="flex gap-2">
                  <Input
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Enter prompt for real estate agent..."
                    className="bg-black/50 border-white/20 text-xs"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isExecuting}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                </div>
              </div>

              {executionResult && (
                <div className="p-3 bg-black/60 border border-orange-500/40 rounded-xl text-xs space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px]">
                    <span className="flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Status: {executionResult.status}
                    </span>
                    <span>{executionResult.node}</span>
                  </div>
                  <p className="text-white/90 text-xs">{executionResult.output}</p>
                </div>
              )}
            </form>
          </SpotlightCard>

          {/* Card 4: Coral Pink Spotlight Card */}
          <SpotlightCard
            variant="coral"
            badge="EXCEL & DATA PROCESSING"
            title="Real Estate Market Analytics"
            subtitle="Automated extraction, price calculation, and marketing copy generation."
          >
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-xs text-white/80 pb-2 border-b border-white/10">
                <span className="flex items-center font-mono">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                  Dataset: cairo_properties_2026.xlsx
                </span>
                <span className="text-white/50 text-[10px]">1,240 rows</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-[10px] text-white/50">Avg Price / Sqm</p>
                  <p className="text-sm font-bold text-white mt-0.5">42,500 EGP</p>
                </div>
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-[10px] text-white/50">Active Listings</p>
                  <p className="text-sm font-bold text-white mt-0.5">184 Verified</p>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-white/60">
                Integrates with <code className="text-rose-300 font-mono">db/seed_database.py</code> and SQLite repositories.
              </div>
            </div>
          </SpotlightCard>

        </div>

      </div>
    </section>
  )
}
