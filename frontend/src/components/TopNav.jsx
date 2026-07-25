import React from "react"
import { 
  BrainCircuit, 
  FlaskConical, 
  Wrench, 
  Cpu, 
  Plus, 
  SlidersHorizontal, 
  RefreshCw 
} from "lucide-react"

export function TopNav({ 
  onOpenCreateSession, 
  onOpenEvalSuite, 
  onOpenToolRegistry, 
  onOpenContextViewer,
  onOpenSettings,
  healthStatus,
  onRefreshHealth
}) {
  return (
    <header className="flex-shrink-0 w-full h-[52px] bg-[#ffffff] border-b border-[#e7e5e4] px-4 sm:px-6 flex items-center justify-between z-30">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#292524] to-[#0c0a09] border border-[#44403c] flex items-center justify-center text-white shadow-2xs">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="font-serif text-base sm:text-lg font-medium text-[#0c0a09] tracking-tight">
          Excel Data Assistant
        </span>
      </div>

      {/* Center Nav Items */}
      <nav className="hidden md:flex items-center space-x-1 text-xs">
        <button
          onClick={onOpenEvalSuite}
          className="px-3 py-1.5 rounded-full text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#f0efed] transition-colors flex items-center gap-1.5 font-medium"
          title="Open Evaluation Suite (Category A-F)"
        >
          <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
          <span>Eval Suite (19)</span>
        </button>

        <button
          onClick={onOpenToolRegistry}
          className="px-3 py-1.5 rounded-full text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#f0efed] transition-colors flex items-center gap-1.5 font-medium"
          title="View Agent Tools & System Specs"
        >
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span>Tools & Specs (8+1)</span>
        </button>

        <button
          onClick={onOpenContextViewer}
          className="px-3 py-1.5 rounded-full text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#f0efed] transition-colors flex items-center gap-1.5 font-medium"
          title="View Stored Session Context Memory"
        >
          <Cpu className="w-3.5 h-3.5 text-[#292524]" />
          <span>DB Memory</span>
        </button>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Gateway Health Indicator */}
        <button
          onClick={onRefreshHealth || onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
            healthStatus?.ok
              ? "bg-[#fafafa] border-[#e7e5e4] text-[#0c0a09] hover:bg-[#f0efed]"
              : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
          }`}
          title={healthStatus?.ok ? "FastAPI Online" : "Gateway Offline — Click to Reconnect"}
        >
          <span className={`w-2 h-2 rounded-full ${healthStatus?.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-[11px]">{healthStatus?.ok ? "Online" : "Simulator"}</span>
        </button>

        {/* New Session Button */}
        <button
          onClick={onOpenCreateSession}
          className="text-xs font-medium text-white bg-[#292524] hover:bg-[#0c0a09] px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  )
}
