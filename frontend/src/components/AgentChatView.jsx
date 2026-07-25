import React, { useState, useRef, useEffect } from "react"
import { 
  BrainCircuit, 
  User, 
  Send, 
  Copy, 
  Check, 
  Building2, 
  Megaphone, 
  Activity, 
  ShieldAlert, 
  Trash2, 
  Zap, 
  RefreshCw,
  ArrowUpRight
} from "lucide-react"
import { AgentExecutionTrace } from "./AgentExecutionTrace"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { scanForPII } from "../lib/api"

const CLEAN_STARTERS = [
  {
    title: "Seattle Active Listings",
    prompt: "List the active listings in Seattle.",
    tag: "A1 • Smoke Test"
  },
  {
    title: "Illinois Listing Count",
    prompt: "How many active listings are there in Illinois?",
    tag: "B1 • Aggregation"
  },
  {
    title: "Ambiguous Delete Target",
    prompt: "Delete the campaign called 'Referral Program - Google Ads 2024 Q3'.",
    tag: "D1 • Clarification"
  },
  {
    title: "Unlinked Datasets Query",
    prompt: "Which marketing campaign generated the sales for listing LST-5002?",
    tag: "E4 • Out of Scope"
  }
]

export function AgentChatView({
  session,
  messages = [],
  onSendMessage,
  onClearMessages,
  isLoading,
  healthStatus,
  onRefreshHealth,
  onOpenContextViewer,
  onOpenEvalSuite,
  onOpenToolRegistry
}) {
  const [inputPrompt, setInputPrompt] = useState("")
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Live PII pre-flight scan
  const piiScan = scanForPII(inputPrompt)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!inputPrompt.trim() || isLoading) return
    onSendMessage(inputPrompt.trim())
    setInputPrompt("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#f5f5f5] relative overflow-hidden">
      {/* Offline Gateway Banner */}
      {!healthStatus?.ok && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between flex-shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Standalone Mode — Gateway offline. Powered by grounded evaluation engine.</span>
          </div>

          {onRefreshHealth && (
            <button
              onClick={onRefreshHealth}
              className="px-2 py-0.5 rounded-full bg-[#ffffff] border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-sans transition-all"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Main Chat Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 lg:px-12 py-4">
        {!session ? (
          /* No Session Selected */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 py-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#292524] to-[#0c0a09] border border-[#44403c] flex items-center justify-center text-white shadow-2xs">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#0c0a09]">
              Data Assistant Workspace
            </h3>
            <p className="text-xs text-[#777169] leading-relaxed">
              Select or create a workspace session to start querying listings and campaigns.
            </p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Session State — Minimal Editorial Greeting */
          <div className="max-w-2xl mx-auto space-y-8 py-8 sm:py-16 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#292524] via-[#1c1917] to-[#0c0a09] border border-[#44403c] flex items-center justify-center text-white mx-auto shadow-sm">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-[#0c0a09] tracking-tight">
                How can I assist with your data today?
              </h2>
              <p className="text-xs text-[#777169] max-w-md mx-auto leading-relaxed">
                Query, aggregate, or update real estate listings (<code className="font-mono bg-[#e7e5e4] px-1 py-0.2 rounded text-[#0c0a09]">LST-5001..6000</code>) and marketing campaigns (<code className="font-mono bg-[#e7e5e4] px-1 py-0.2 rounded text-[#0c0a09]">CMP-8001..9000</code>).
              </p>
            </div>

            {/* Clean Prompt Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-xl mx-auto">
              {CLEAN_STARTERS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.prompt)}
                  className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e7e5e4] hover:border-[#0c0a09] shadow-2xs hover:shadow-xs transition-all duration-150 group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#777169] bg-[#f0efed] px-2 py-0.5 rounded-full border border-[#e7e5e4]">
                      {item.tag}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#777169] group-hover:text-[#0c0a09] transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#0c0a09]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#4e4e4e] font-mono truncate">
                    "{item.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Timeline */
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e7e5e4] text-xs text-[#777169]">
              <span className="font-serif font-medium text-[#0c0a09]">{session.session_name}</span>
              <button
                onClick={onClearMessages}
                className="hover:text-rose-600 flex items-center gap-1 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-[#292524] to-[#0c0a09] border border-[#44403c] flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-2xs">
                    <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] md:max-w-[84%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all ${
                    msg.role === "user"
                      ? "bg-[#f0efed] border border-[#d6d3d1] text-[#0c0a09] rounded-tr-none shadow-xs"
                      : msg.isError
                      ? "bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none"
                      : "bg-[#ffffff] border border-[#e7e5e4] text-[#0c0a09] rounded-tl-none shadow-soft-drop"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-[#f0efed] text-[10px] font-mono text-[#777169]">
                    <span className="font-serif text-xs font-normal text-[#0c0a09]">
                      {msg.role === "user" ? "You" : "Data Assistant Agent"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="opacity-70 text-[9px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-0.5 text-[#777169] hover:text-[#0c0a09]"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <MarkdownRenderer content={msg.content} isUser={msg.role === "user"} />

                  {msg.role === "agent" && msg.execution_trace && (
                    <AgentExecutionTrace
                      trace={msg.execution_trace}
                      telemetry={{
                        request_id: msg.request_id,
                        tokens: msg.tokens,
                        cost_usd: msg.cost_usd,
                        latency_ms: msg.latency_ms,
                      }}
                      stepCount={msg.step_count}
                      maxSteps={msg.max_steps || 5}
                    />
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-6.5 h-6.5 rounded-lg bg-[#f0efed] border border-[#d6d3d1] text-[#0c0a09] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-3.5 h-3.5 text-[#292524]" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-[#292524] to-[#0c0a09] border border-[#44403c] flex items-center justify-center text-white flex-shrink-0 shadow-2xs">
                  <BrainCircuit className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                </div>
                <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-2xl px-3.5 py-2 text-xs text-[#777169] font-mono flex items-center gap-2 shadow-2xs">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0c0a09] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0c0a09] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0c0a09] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Executing agent loop...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pinned Input Footer */}
      <footer className="flex-shrink-0 p-3 sm:px-8 bg-[#ffffff] border-t border-[#e7e5e4] z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-1.5">
          {piiScan.found && (
            <div className="px-3 py-1 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between font-mono rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>Security scanner: {piiScan.matches.join(", ")} detected.</span>
              </div>
              <button type="button" onClick={() => setInputPrompt("")} className="text-[10px] underline">
                Clear
              </button>
            </div>
          )}

          <div className="relative rounded-2xl bg-[#fafafa] border border-[#e7e5e4] focus-within:border-[#0c0a09] focus-within:bg-[#ffffff] transition-all">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!session || isLoading}
              maxLength={4000}
              placeholder={
                session
                  ? "Ask about real estate listings or marketing campaigns... (Press Enter ↵)"
                  : "Select or create a session..."
              }
              className="w-full bg-transparent text-[#0c0a09] text-xs sm:text-sm p-3 pr-12 rounded-2xl resize-none placeholder:text-[#a8a29e] focus:outline-none disabled:opacity-50"
            />

            <div className="absolute right-2.5 bottom-2.5">
              <button
                type="submit"
                disabled={!session || !inputPrompt.trim() || isLoading}
                className="w-7 h-7 rounded-full bg-[#292524] text-white hover:bg-[#0c0a09] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xs"
                title="Send Prompt"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-[#777169] px-1 font-mono">
            <span>MAX_STEPS = 5 • 50-row query cap</span>
            <span>Press Enter ↵ to send</span>
          </div>
        </form>
      </footer>
    </div>
  )
}
