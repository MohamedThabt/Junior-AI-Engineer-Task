import React, { useState, useRef, useEffect } from "react"
import { 
  DatabaseZap, 
  User, 
  Send, 
  Copy, 
  Check, 
  Building2, 
  Megaphone, 
  Activity, 
  ShieldAlert, 
  Zap, 
  RefreshCw,
  ArrowUpRight
} from "lucide-react"
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
  onOpenToolRegistry,
  prefillPrompt,
  prefillNonce
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

  // Fills the composer with a prompt picked from the Evaluation Suite modal.
  // Intentionally does NOT send — the user reviews/edits, then hits Send.
  useEffect(() => {
    if (!prefillNonce) return
    setInputPrompt(prefillPrompt || "")
    textareaRef.current?.focus()
  }, [prefillNonce, prefillPrompt])

  const fillPrompt = (text) => {
    setInputPrompt(text)
    textareaRef.current?.focus()
  }

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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#f8fafc] relative overflow-hidden">
      {/* Offline Gateway Banner */}
      {!healthStatus?.ok && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900 flex items-center justify-between flex-shrink-0 font-sans backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-medium">
              FastAPI Gateway Disconnected — Please make sure the backend service is running.
            </span>
          </div>

          {onRefreshHealth && (
            <button
              onClick={onRefreshHealth}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-medium transition-all shadow-xs"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Main Chat Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 lg:px-12 py-6">
        {!session ? (
          /* No Session Selected */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
              <DatabaseZap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Data Assistant Workspace
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Select an existing conversation session or create a new session to start querying the Excel database.
            </p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Session State — Modern Greeting */
          <div className="max-w-2xl mx-auto space-y-8 py-8 sm:py-16 text-center">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
                <DatabaseZap className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How can I assist with your data today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Query, aggregate, or update real estate listings (<code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 border border-slate-200">LST-5001..6000</code>) and marketing campaigns (<code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 border border-slate-200">CMP-8001..9000</code>).
              </p>
            </div>

            {/* Prompt Starter Chips — fill the composer only, review before sending */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
              {CLEAN_STARTERS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => fillPrompt(item.prompt)}
                  title="Fills the input below — press Send to run it"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200 group space-y-1.5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      {item.tag}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    "{item.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Timeline */
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500">
              <span className="font-semibold text-slate-900 text-sm">{session.session_name}</span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 shadow-2xs">
                    <DatabaseZap className="w-4 h-4 text-emerald-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] md:max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all ${
                    msg.role === "user"
                      ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-tr-xs shadow-xs"
                      : msg.isError
                      ? "bg-rose-50 border border-rose-200 text-rose-950 rounded-tl-xs shadow-xs"
                      : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 font-sans">
                    <span className={`font-bold text-xs ${msg.role === "user" ? "text-slate-200" : "text-slate-800"}`}>
                      {msg.role === "user" ? "You" : "Data Assistant Agent"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono ${msg.role === "user" ? "text-slate-400" : "text-slate-500"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                          msg.role === "user" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-800"
                        }`}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <MarkdownRenderer content={msg.content} isUser={msg.role === "user"} />
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-2xs">
                  <DatabaseZap className="w-4 h-4 animate-pulse text-emerald-400" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-600 font-mono flex items-center gap-3 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-sans font-medium text-slate-700">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pinned Input Footer */}
      <footer className="flex-shrink-0 p-3 sm:px-8 bg-white border-t border-slate-200 z-10 shadow-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-1.5">
          {piiScan.found && (
            <div className="px-3.5 py-1.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center justify-between font-mono rounded-t-xl">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Security Scanner: {piiScan.matches.join(", ")} detected. Prompt will be blocked.</span>
              </div>
              <button type="button" onClick={() => setInputPrompt("")} className="text-[11px] font-sans font-medium underline hover:text-rose-950">
                Clear Input
              </button>
            </div>
          )}

          <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all shadow-xs">
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
              className="w-full bg-transparent text-slate-900 text-xs sm:text-sm p-3.5 pr-12 rounded-2xl resize-none placeholder:text-slate-400 focus:outline-none disabled:opacity-50 font-sans"
            />

            <div className="absolute right-3 bottom-3">
              <button
                type="submit"
                disabled={!session || !inputPrompt.trim() || isLoading}
                className="w-8 h-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm"
                title="Send Prompt"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
            <span>MAX_LOOP_ITERATIONS = 5 • 50-row query cap</span>
            <span>Press Enter ↵ to send</span>
          </div>
        </form>
      </footer>
    </div>
  )
}
