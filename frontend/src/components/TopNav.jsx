import React, { useState } from "react"
import { Cpu, Server, ExternalLink, Settings, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { Modal } from "./ui/Modal"
import { Input } from "./ui/Input"
import { getStoredBaseUrl, setStoredBaseUrl } from "@/lib/api"

export const TopNav = ({
  healthStatus,
  onRefreshHealth,
  onOpenCreateSession,
  activeTab,
  setActiveTab
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [baseUrlInput, setBaseUrlInput] = useState(getStoredBaseUrl())

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setStoredBaseUrl(baseUrlInput)
    setIsSettingsOpen(false)
    if (onRefreshHealth) onRefreshHealth()
  }

  const isHealthy = healthStatus?.ok

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas/90 backdrop-blur-xl border-b border-hairline transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/20 flex items-center justify-center text-white shadow-inner">
            <Cpu className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-tight text-sm uppercase">AGENCY AI</span>
              <span className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded font-mono">v1.0</span>
            </div>
            <p className="text-[11px] text-ink-muted hidden sm:block">Intelligent Real Estate Engine</p>
          </div>
        </div>

        {/* Center: Navigation Pill Tabs (Framer style) */}
        <nav className="hidden md:flex items-center p-1 bg-surface-1 border border-white/10 rounded-pill">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "sessions", label: "Sessions" },
            { id: "spotlights", label: "Agent Features" },
            { id: "diagnostics", label: "API Telemetry" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-pill transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-surface-2 text-white shadow-sm"
                  : "text-ink-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions & API Status */}
        <div className="flex items-center space-x-3">
          {/* Health Pill Indicator */}
          <div 
            onClick={onRefreshHealth}
            title="Click to re-check API health"
            className="cursor-pointer hidden sm:flex items-center"
          >
            {isHealthy ? (
              <Badge variant="sky">
                <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                API Healthy ({healthStatus?.latency || 0}ms)
              </Badge>
            ) : (
              <Badge variant="warning">
                <AlertCircle className="w-3 h-3 mr-1 text-amber-400" />
                Backend Offline
              </Badge>
            )}
          </div>

          <Button
            variant="icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Configure API Endpoint"
          >
            <Settings className="w-4 h-4 text-ink-muted hover:text-white transition-colors" />
          </Button>

          <a
            href="http://127.0.0.1:8000/ui"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex"
          >
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-ink-muted" />
              Gradio UI
            </Button>
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateSession}
          >
            + New Session
          </Button>
        </div>
      </div>

      {/* Settings Modal for API Base URL */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="API Server Configuration"
        description="Configure the backend API server URL used by this React app."
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">
              API Base URL
            </label>
            <Input
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
            <p className="text-xs text-ink-muted mt-2">
              Must match the backend FastAPI server endpoint where endpoints like <code className="text-accent-blue font-mono">/api/health</code> and <code className="text-accent-blue font-mono">/api/sessions/</code> are hosted.
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setBaseUrlInput("http://127.0.0.1:8000")
                setStoredBaseUrl("http://127.0.0.1:8000")
              }}
            >
              Reset Default
            </Button>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Connect
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </header>
  )
}
