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

export function AgentExecutionTrace({ trace = [], telemetry = {}, loopIterationCount = 0, maxLoopIterations = 5 }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!trace || trace.length === 0) return null

  return (
    <div className="mt-3 border border-slate-200 rounded-2xl bg-white overflow-hidden text-xs shadow-xs">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 text-slate-700 transition-all font-mono text-[11px]"
      >
        <div className="flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-slate-800" />
          <span className="font-bold text-slate-900 font-sans">Agent Execution Trace</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-800 border border-slate-300/50 text-[10px] font-semibold">
            {loopIterationCount || trace.length}/{maxLoopIterations} Loop Iterations
          </span>
        </div>

        <div className="flex items-center gap-3">
          {telemetry.cost_usd !== undefined && (
            <span className="hidden sm:inline-block text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ${telemetry.cost_usd} USD
            </span>
          )}
          {telemetry.latency_ms && (
            <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {telemetry.latency_ms}ms
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-3.5 bg-slate-50/60 border-t border-slate-200 font-sans">
          {/* Telemetry Summary Bar */}
          {telemetry && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-600 shadow-2xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Request ID:</span>
                <span className="text-slate-900 font-medium">{telemetry.request_id || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tokens (In/Out/Total):</span>
                <span className="text-slate-900 font-medium">
                  {telemetry.tokens?.prompt_tokens || 0} / {telemetry.tokens?.completion_tokens || 0} / {telemetry.tokens?.total_tokens || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Calculated Cost:</span>
                <span className="text-emerald-700 font-semibold">${telemetry.cost_usd || 0} USD</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Latency:</span>
                <span className="text-slate-900 font-medium">{telemetry.latency_ms || 0}ms</span>
              </div>
            </div>
          )}

          {/* Timeline of Loop Iterations */}
          <div className="space-y-3">
            {trace.map((loopIterationItem, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                {/* Loop Iteration Header */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-bold text-[10px]">
                      Loop iteration {loopIterationItem.loop_iteration}
                    </span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5 font-sans">
                      <Terminal className="w-3.5 h-3.5 text-slate-700" />
                      Tool: <code className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">{loopIterationItem.tool}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[10px] font-mono">
                    <span className="text-slate-500">{loopIterationItem.latency_ms}ms</span>
                    <span className="text-slate-400">({loopIterationItem.attempts || 1}/2 retries)</span>
                    {loopIterationItem.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                </div>

                {/* Planner Logic */}
                {loopIterationItem.planner && (
                  <div className="text-xs text-slate-700 leading-relaxed pl-3.5 border-l-2 border-slate-900 py-1 bg-slate-50 rounded-r-lg font-sans">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-0.5">
                      Planner Decision:
                    </span>
                    {loopIterationItem.planner}
                  </div>
                )}

                {/* Executor Arguments */}
                {loopIterationItem.args && (
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div className="text-slate-400 mb-1 flex items-center justify-between text-[10px] uppercase font-bold">
                      <span>Executor Dispatch Args:</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-emerald-300">
                      {JSON.stringify(loopIterationItem.args, null, 2)}
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
