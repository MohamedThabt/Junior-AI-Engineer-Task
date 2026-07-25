import React from "react"
import { 
  DatabaseZap, 
  FlaskConical, 
  Wrench, 
  Cpu, 
  Plus, 
  RefreshCw 
} from "lucide-react"

export function TopNav({ 
  onOpenCreateSession, 
  onOpenEvalSuite, 
  onOpenToolRegistry, 
  onOpenContextViewer,
  healthStatus,
  onRefreshHealth
}) {
  return (
    <header className="flex-shrink-0 w-full h-[56px] bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-sm">
          <DatabaseZap className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight font-sans">
            Excel Data Assistant
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Agent Studio v1.0
          </span>
        </div>
      </div>

      {/* Center Nav Items */}
      <nav className="hidden md:flex items-center space-x-1.5 text-xs font-sans font-medium">
        <button
          onClick={onOpenEvalSuite}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          title="Open Evaluation Suite (Category A-F)"
        >
          <FlaskConical className="w-4 h-4 text-purple-600" />
          <span>Eval Suite</span>
        </button>

        <button
          onClick={onOpenToolRegistry}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          title="View Agent Tools & System Specs"
        >
          <Wrench className="w-4 h-4 text-blue-600" />
          <span>Tools & Specs</span>
        </button>

        <button
          onClick={onOpenContextViewer}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          title="View Stored Session Context Memory"
        >
          <Cpu className="w-4 h-4 text-slate-700" />
          <span>DB Memory</span>
        </button>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Gateway Health Indicator */}
        <button
          onClick={onRefreshHealth}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            healthStatus?.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 shadow-2xs"
              : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 shadow-2xs"
          }`}
          title={healthStatus?.ok ? "FastAPI Online" : "FastAPI Disconnected — Click to Reconnect"}
        >
          <span className={`w-2 h-2 rounded-full ${healthStatus?.ok ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-[11px] font-semibold">{healthStatus?.ok ? "FastAPI Online" : "FastAPI Offline"}</span>
        </button>

        {/* New Session Button */}
        <button
          onClick={onOpenCreateSession}
          className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  )
}
