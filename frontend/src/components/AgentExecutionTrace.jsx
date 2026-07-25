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
    <div className="mt-3 border border-[#e7e5e4] rounded-xl bg-[#ffffff] overflow-hidden text-xs shadow-xs">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[#fafafa] hover:bg-[#f0efed] text-[#4e4e4e] hover:text-[#0c0a09] transition-colors border-b border-[#e7e5e4] font-mono text-[11px]"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#292524]" />
          <span className="font-semibold text-[#0c0a09]">Agent Execution Trace</span>
          <span className="px-2 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] border border-[#e7e5e4] text-[10px] font-medium">
            {stepCount || trace.length}/{maxSteps} Steps
          </span>
        </div>

        <div className="flex items-center gap-3">
          {telemetry.cost_usd !== undefined && (
            <span className="hidden sm:inline-block text-[10px] text-emerald-700 font-semibold">
              ${telemetry.cost_usd} USD
            </span>
          )}
          {telemetry.latency_ms && (
            <span className="hidden sm:inline-block text-[10px] text-[#777169] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#777169]" />
              {telemetry.latency_ms}ms
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#777169]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#777169]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-3 bg-[#f5f5f5]">
          {/* Telemetry Summary Bar */}
          {telemetry && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#ffffff] border border-[#e7e5e4] text-[10px] font-mono text-[#4e4e4e]">
              <div>
                <span className="text-[#777169] block">Request ID:</span>
                <span className="text-[#0c0a09] font-medium">{telemetry.request_id || "N/A"}</span>
              </div>
              <div>
                <span className="text-[#777169] block">Tokens (In/Out/Total):</span>
                <span className="text-[#0c0a09]">
                  {telemetry.tokens?.prompt_tokens || 0} / {telemetry.tokens?.completion_tokens || 0} / {telemetry.tokens?.total_tokens || 0}
                </span>
              </div>
              <div>
                <span className="text-[#777169] block">Calculated Cost:</span>
                <span className="text-emerald-700 font-semibold">${telemetry.cost_usd || 0} USD</span>
              </div>
              <div>
                <span className="text-[#777169] block">Total Latency:</span>
                <span className="text-[#0c0a09] font-medium">{telemetry.latency_ms || 0}ms</span>
              </div>
            </div>
          )}

          {/* Timeline of Steps */}
          <div className="space-y-2.5">
            {trace.map((stepItem, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e7e5e4] space-y-2 shadow-xs">
                {/* Step Header */}
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#292524] text-white font-semibold text-[10px]">
                      Step {stepItem.step}
                    </span>
                    <span className="font-semibold text-[#0c0a09] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#292524]" />
                      Tool: <code className="text-[#0c0a09] font-bold bg-[#f0efed] px-1.5 py-0.5 rounded">{stepItem.tool}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#777169]">{stepItem.latency_ms}ms</span>
                    <span className="text-[#777169]">({stepItem.attempts || 1}/2 retries)</span>
                    {stepItem.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                  </div>
                </div>

                {/* Planner Logic */}
                {stepItem.planner && (
                  <div className="text-[11px] text-[#4e4e4e] leading-relaxed pl-3 border-l-2 border-[#292524] py-0.5 bg-[#fafafa] rounded-r">
                    <span className="text-[10px] text-[#0c0a09] font-mono font-semibold uppercase block">
                      Planner Decision:
                    </span>
                    {stepItem.planner}
                  </div>
                )}

                {/* Executor Arguments */}
                {stepItem.args && (
                  <div className="bg-[#fafafa] p-2.5 rounded-lg border border-[#e7e5e4] font-mono text-[10px]">
                    <div className="text-[#777169] mb-1 flex items-center justify-between">
                      <span>Executor Dispatch Args:</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                    <pre className="text-[#0c0a09] overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
