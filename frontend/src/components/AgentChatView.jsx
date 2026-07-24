import React, { useState, useRef, useEffect } from "react"
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Building2, 
  Activity, 
  Terminal, 
  Cpu, 
  ChevronRight,
  Trash2
} from "lucide-react"

const PROMPT_STARTERS = [
  {
    icon: Building2,
    title: "Cairo Real Estate Insights",
    prompt: "Provide an analysis of the top residential investment areas in New Cairo and 6th of October City.",
    category: "Real Estate",
  },
  {
    icon: Activity,
    title: "Run System Diagnostic",
    prompt: "Execute system diagnostics on backend services and check database health status.",
    category: "Telemetry",
  },
  {
    icon: Terminal,
    title: "SQL Query Assistant",
    prompt: "Generate an optimized SQL query to retrieve property sessions created in the last 30 days.",
    category: "Database",
  },
  {
    icon: Cpu,
    title: "AI Agent Capabilities",
    prompt: "What tools and models are currently available in this AI Agent workspace?",
    category: "Agent Info",
  },
]

export function AgentChatView({
  session,
  messages = [],
  onSendMessage,
  onClearMessages,
  isLoading,
  healthStatus,
}) {
  const [inputPrompt, setInputPrompt] = useState("")
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Handle form submit
  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!inputPrompt.trim() || isLoading) return
    onSendMessage(inputPrompt.trim())
    setInputPrompt("")
  }

  // Handle keypress (Enter to submit, Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle copy response text
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative overflow-hidden">
      {/* Header Bar */}
      <header className="h-14 px-6 bg-[#09090b] border-b border-zinc-800/80 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <Bot className="w-5 h-5 text-zinc-200 flex-shrink-0" />
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              {session ? session.session_name : "Select or Create Session"}
              {session && (
                <span className="text-[10px] font-mono text-zinc-500">
                  [{session.id.slice(0, 8)}]
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${healthStatus?.ok ? "bg-emerald-500" : "bg-red-500"}`} />
            {healthStatus?.ok ? "System Ready" : "Disconnected"}
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6">
        {!session ? (
          /* Empty / No Session Selected State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 py-12">
            <Bot className="w-8 h-8 text-zinc-600 mb-1" />
            <h3 className="text-sm font-semibold text-zinc-200">
              AI Agent Workspace
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Select an existing session from the sidebar or create a new session to begin interacting with the agent.
            </p>
          </div>
        ) : messages.length === 0 ? (
          /* Session Empty / Prompt Starters State */
          <div className="max-w-3xl mx-auto space-y-8 py-8">
            {/* Hero Title */}
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                {session.session_name}
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Type your instructions below or select a prompt starter to begin.
              </p>
            </div>

            {/* Prompt Starter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {PROMPT_STARTERS.map((item, idx) => {
                const IconComponent = item.icon
                return (
                  <div
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="group relative p-4 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent className="w-4 h-4 text-zinc-300" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center justify-between">
                        {item.title}
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        "{item.prompt}"
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Chat History Timeline */
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Agent Solid Icon without background */}
                {msg.role === "agent" && (
                  <Bot className="w-4 h-4 text-zinc-400 mt-1 flex-shrink-0" />
                )}

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-lg px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-100 text-zinc-950 font-medium"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-zinc-800/60 text-[10px] opacity-60 font-mono">
                    <span>{msg.role === "user" ? "You" : "Agent"}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Action Bar for Agent */}
                  {msg.role === "agent" && (
                    <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Verified Agent Response</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Solid Icon without background */}
                {msg.role === "user" && (
                  <User className="w-4 h-4 text-zinc-500 mt-1 flex-shrink-0" />
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <Bot className="w-4 h-4 text-zinc-400 flex-shrink-0 animate-pulse" />
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 flex items-center gap-2 font-mono">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Agent processing query...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <footer className="p-4 md:px-12 bg-[#09090b] border-t border-zinc-800/80 z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
          {/* Helper Tags */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400 pb-0.5 no-scrollbar">
            <span className="text-[10px] text-zinc-600 font-mono uppercase">Quick:</span>
            <button
              type="button"
              onClick={() => setInputPrompt("Run health check and output status report.")}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Activity className="w-3 h-3 text-zinc-400" />
              Health Report
            </button>
            <button
              type="button"
              onClick={() => setInputPrompt("Query all active chat sessions and print summary.")}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Terminal className="w-3 h-3 text-zinc-400" />
              Session Summary
            </button>
            <button
              type="button"
              onClick={() => setInputPrompt("Explain agent tools and real estate database capabilities.")}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3 h-3 text-zinc-400" />
              Capabilities
            </button>
          </div>

          {/* Textarea Input Card */}
          <div className="relative rounded-lg bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!session || isLoading}
              placeholder={
                session
                  ? "Message AI Agent... (Enter to send, Shift+Enter for new line)"
                  : "Select or create a session first..."
              }
              className="w-full bg-transparent text-zinc-100 text-xs p-3 pr-12 rounded-lg resize-none placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />

            {/* Send Button */}
            <div className="absolute right-2.5 bottom-2.5">
              <button
                type="submit"
                disabled={!session || !inputPrompt.trim() || isLoading}
                className="p-1.5 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send Prompt"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shortcut note */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5 font-mono">
            <span>AI Agent Studio</span>
            <span>Press Enter ↵ to send</span>
          </div>
        </form>
      </footer>
    </div>
  )
}
