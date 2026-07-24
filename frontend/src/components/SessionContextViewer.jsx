import React, { useState, useEffect } from "react"
import { Modal } from "./ui/Modal"
import { getSessionDetails } from "../lib/api"
import { Database, Copy, Check, RefreshCw, Layers } from "lucide-react"

export function SessionContextViewer({ isOpen, onClose, session }) {
  const [sessionDetails, setSessionDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && session?.id) {
      loadContext()
    }
  }, [isOpen, session])

  const loadContext = async () => {
    setIsLoading(true)
    const res = await getSessionDetails(session.id)
    setIsLoading(false)

    if (res.ok && res.data) {
      setSessionDetails(res.data)
    } else {
      setSessionDetails({
        id: session.id,
        session_name: session.session_name,
        context: session.context || "No context serialized yet.",
        created_at: session.created_at || new Date().toISOString(),
        updated_at: session.updated_at || new Date().toISOString(),
      })
    }
  }

  const handleCopy = () => {
    const text = typeof sessionDetails?.context === "string" 
      ? sessionDetails.context 
      : JSON.stringify(sessionDetails, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!session) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stored Session Context & Memory"
      description={`Inspect SQLite ChatSessionRepository state for "${session.session_name}" [${(session.id || session.session_id || "").slice(0, 8)}]`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>DB Record ID: <code className="text-zinc-200">{session.id || session.session_id}</code></span>
          </div>


          <div className="flex items-center gap-2">
            <button
              onClick={loadContext}
              disabled={isLoading}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh DB Context"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
              title="Copy Context"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-zinc-500 animate-pulse">
              Loading session context from ChatSessionRepository...
            </div>
          ) : (
            <pre className="text-cyan-300/90 whitespace-pre-wrap leading-relaxed">
              {typeof sessionDetails?.context === "string" 
                ? sessionDetails.context || "{ \"memory\": [], \"status\": \"active\" }" 
                : JSON.stringify(sessionDetails, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </Modal>
  )
}
