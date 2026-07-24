import React, { useState } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  ShieldCheck,
  Terminal,
  Database
} from "lucide-react"

export function AgentExecutionTrace({ trace = [], telemetry = {}, stepCount = 0, maxSteps = 5 }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!trace || trace.length === 0) return null

  return (
    <div className="mt-3 border border-zinc-800/90 rounded-lg bg-zinc-950/70 overflow-hidden text-xs">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors border-b border-zinc-800/40 font-mono text-[11px]"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-zinc-300">Agent Execution Trace</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 text-[10px]">
            {stepCount || trace.length}/{maxSteps} Steps
          </span>
        </div>

        <div className="flex items-center gap-3">
          {telemetry.cost_usd !== undefined && (
            <span className="hidden sm:inline-block text-[10px] text-emerald-400">
              ${telemetry.cost_usd} USD
            </span>
          )}
          {telemetry.latency_ms && (
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              {telemetry.latency_ms}ms
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-3.5 space-y-3 bg-[#09090b]">
          {/* Telemetry Summary Bar */}
          {telemetry && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              <div>
                <span className="text-zinc-500 block">Request ID:</span>
                <span className="text-zinc-200">{telemetry.request_id || "N/A"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Tokens (In/Out/Total):</span>
                <span className="text-zinc-200">
                  {telemetry.tokens?.prompt_tokens || 0} / {telemetry.tokens?.completion_tokens || 0} / {telemetry.tokens?.total_tokens || 0}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Calculated Cost:</span>
                <span className="text-emerald-400 font-semibold">${telemetry.cost_usd || 0} USD</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Latency:</span>
                <span className="text-cyan-400">{telemetry.latency_ms || 0}ms</span>
              </div>
            </div>
          )}

          {/* Timeline of Steps */}
          <div className="space-y-2.5">
            {trace.map((stepItem, idx) => (
              <div key={idx} className="p-3 rounded-md bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                {/* Step Header */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold text-[10px]">
                      Step {stepItem.step}
                    </span>
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      Tool: <code className="text-cyan-300">{stepItem.tool}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-zinc-400">{stepItem.latency_ms}ms</span>
                    <span className="text-zinc-400">({stepItem.attempts || 1}/2 retries)</span>
                    {stepItem.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Planner Logic */}
                {stepItem.planner && (
                  <div className="text-[11px] text-zinc-400 leading-relaxed pl-2 border-l-2 border-cyan-500/40">
                    <span className="text-[10px] text-cyan-400 font-mono font-semibold uppercase block">
                      Planner Decision:
                    </span>
                    {stepItem.planner}
                  </div>
                )}

                {/* Executor Arguments */}
                {stepItem.args && (
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60 font-mono text-[10px]">
                    <div className="text-zinc-500 mb-1 flex items-center justify-between">
                      <span>Executor Dispatch Args:</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    </div>
                    <pre className="text-emerald-300/90 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(stepItem.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
