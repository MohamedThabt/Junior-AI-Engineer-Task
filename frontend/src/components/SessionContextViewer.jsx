import React, { useState, useEffect } from "react"
import { Modal } from "./ui/Modal"
import { getSessionDetails } from "../lib/api"
import { Database, Copy, Check, RefreshCw, Layers } from "lucide-react"

export function SessionContextViewer({ isOpen, onClose, session }) {
  const [sessionDetails, setSessionDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const sId = session?.id || session?.session_id
    if (isOpen && sId) {
      loadContext()
    }
  }, [isOpen, session])

  const loadContext = async () => {
    const sId = session?.id || session?.session_id
    if (!sId) return
    setIsLoading(true)
    const res = await getSessionDetails(sId)
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
      className="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-[#777169]">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#292524]" />
            <span>DB Record ID: <code className="text-[#0c0a09] font-medium">{session.id || session.session_id}</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadContext}
              disabled={isLoading}
              className="p-1 rounded-full hover:bg-[#f0efed] text-[#777169] hover:text-[#0c0a09] transition-colors"
              title="Refresh DB Context"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full hover:bg-[#f0efed] text-[#777169] hover:text-[#0c0a09] transition-colors flex items-center gap-1 text-[11px]"
              title="Copy Context"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e7e5e4] font-mono text-[11px] max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-[#777169] animate-pulse">
              Loading session context from ChatSessionRepository...
            </div>
          ) : (
            <pre className="text-[#0c0a09] whitespace-pre-wrap leading-relaxed">
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
