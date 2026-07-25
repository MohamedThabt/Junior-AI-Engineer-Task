import React, { useState, useEffect, useCallback } from "react"
import { TopNav } from "./components/TopNav"
import { AgentSidebar } from "./components/AgentSidebar"
import { AgentChatView } from "./components/AgentChatView"
import { SessionContextViewer } from "./components/SessionContextViewer"
import { EvaluationSuiteModal } from "./components/EvaluationSuiteModal"
import { ToolRegistryModal } from "./components/ToolRegistryModal"
import { Modal } from "./components/ui/Modal"
import { Input } from "./components/ui/Input"
import { Button } from "./components/ui/Button"
import { 
  getHealth, 
  getSessions, 
  getSessionDetails,
  createSession, 
  deleteSession,
  sendAgentMessage,
  parseBackendContext,
  getStoredBaseUrl,
  setStoredBaseUrl
} from "./lib/api"

export default function App() {
  // Telemetry & Sessions State
  const [healthStatus, setHealthStatus] = useState({ ok: false, latency: 0 })
  const [sessions, setSessions] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  // Chat messages per session state { [sessionId]: [ { id, role, content, timestamp, execution_trace, ... } ] }
  const [sessionMessages, setSessionMessages] = useState({})
  const [isAgentResponding, setIsAgentResponding] = useState(false)

  // Layout UI & Modals state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Inspector Drawers & Benchmark Modals state
  const [isContextViewerOpen, setIsContextViewerOpen] = useState(false)
  const [isEvalSuiteOpen, setIsEvalSuiteOpen] = useState(false)
  const [isToolRegistryOpen, setIsToolRegistryOpen] = useState(false)

  // Prompt prefill signal — picking an eval-suite prompt only fills the chat
  // composer, it never auto-sends. `prefillNonce` forces the effect in
  // AgentChatView to re-fire even if the same prompt text is chosen twice.
  const [prefillPrompt, setPrefillPrompt] = useState("")
  const [prefillNonce, setPrefillNonce] = useState(0)

  // Check health
  const checkHealth = useCallback(async () => {
    const res = await getHealth()
    setHealthStatus(res)
    return res
  }, [])

  // Fetch session history context from backend controller
  const loadSessionHistory = useCallback(async (sessionId) => {
    if (!sessionId) return
    const res = await getSessionDetails(sessionId)
    if (res.ok && res.data && Array.isArray(res.data.context)) {
      const parsedMsgs = parseBackendContext(res.data.context)
      if (parsedMsgs.length > 0) {
        setSessionMessages(prev => ({
          ...prev,
          [sessionId]: parsedMsgs
        }))
      }
    }
  }, [])

  // Fetch sessions list matching session_controller.py
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    const res = await getSessions()
    setIsLoadingSessions(false)

    if (res.ok && Array.isArray(res.data)) {
      setSessions(res.data)
      if (res.data.length > 0 && !selectedSession) {
        const first = res.data[0]
        setSelectedSession(first)
        loadSessionHistory(first.id || first.session_id)
      }
    } else {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSessions(res.data)
        if (!selectedSession) {
          setSelectedSession(res.data[0])
        }
      } else {
        setSessions([])
      }
    }
    return res
  }, [selectedSession, loadSessionHistory])

  // Sync session messages when selectedSession changes
  useEffect(() => {
    if (selectedSession) {
      const sId = selectedSession.id || selectedSession.session_id
      loadSessionHistory(sId)
    }
  }, [selectedSession, loadSessionHistory])

  // Handle session creation matching session_controller.py (POST /api/sessions/)
  const handleCreateSessionSubmit = async (e) => {
    e?.preventDefault()
    if (!newSessionName.trim()) return

    setIsCreatingSession(true)
    setCreateError(null)

    const res = await createSession(newSessionName.trim())
    setIsCreatingSession(false)

    if (res.ok && res.data) {
      setNewSessionName("")
      setIsCreateModalOpen(false)
      const newSess = {
        id: res.data.id || res.data.session_id,
        session_id: res.data.session_id || res.data.id,
        session_name: res.data.session_name,
        created_at: new Date().toISOString()
      }
      setSessions(prev => [newSess, ...prev.filter(s => s.id !== newSess.id)])
      setSelectedSession(newSess)
    } else {
      setCreateError(res.error || "Could not connect to FastAPI server to create session.")
    }
  }

  // Handle session deletion matching session_controller.py (DELETE /api/sessions/{session_id})
  const handleDeleteSession = async (sessionId) => {
    const res = await deleteSession(sessionId)
    const remaining = sessions.filter(s => (s.id || s.session_id) !== sessionId)
    setSessions(remaining)
    if ((selectedSession?.id || selectedSession?.session_id) === sessionId) {
      setSelectedSession(remaining.length > 0 ? remaining[0] : null)
    }
    return res
  }

  // Handle user sending a prompt message matching agent_controller.py (POST /api/agent/chat)
  const handleSendMessage = async (promptText) => {
    let currentSession = selectedSession

    // Ensure session exists via API call
    if (!currentSession) {
      const createRes = await createSession("New Session")
      if (createRes.ok && createRes.data) {
        currentSession = {
          id: createRes.data.id || createRes.data.session_id,
          session_id: createRes.data.session_id || createRes.data.id,
          session_name: createRes.data.session_name,
          created_at: new Date().toISOString()
        }
        setSessions(prev => [currentSession, ...prev])
        setSelectedSession(currentSession)
      } else {
        alert("Cannot send message: FastAPI backend is offline or returned an error.")
        return
      }
    }

    if (!promptText.trim()) return

    const sId = currentSession.id || currentSession.session_id
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: Date.now(),
    }

    // Append user message immediately
    setSessionMessages(prev => ({
      ...prev,
      [sId]: [...(prev[sId] || []), userMsg]
    }))

    setIsAgentResponding(true)

    // Call Agent Controller Endpoint
    const agentRes = await sendAgentMessage(sId, promptText)
    setIsAgentResponding(false)

    if (agentRes.ok && agentRes.data) {
      const data = agentRes.data

      // Fetch official persisted context from backend controller
      const detailRes = await getSessionDetails(sId)
      if (detailRes.ok && detailRes.data && Array.isArray(detailRes.data.context)) {
        const parsedBackendMsgs = parseBackendContext(detailRes.data.context)
        if (parsedBackendMsgs.length > 0) {
          setSessionMessages(prev => ({
            ...prev,
            [sId]: parsedBackendMsgs
          }))
          return
        }
      }

      // Response fallback if detail context is empty
      const agentMsg = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: data.answer || "Request processed.",
        execution_trace: data.execution_trace || [],
        loop_iteration_count: data.loop_iteration_count || 1,
        max_loop_iterations: data.max_loop_iterations || 5,
        request_id: data.request_id,
        tokens: data.tokens,
        cost_usd: data.cost_usd,
        latency_ms: data.latency_ms || agentRes.latency,
        timestamp: Date.now(),
      }

      setSessionMessages(prev => ({
        ...prev,
        [sId]: [...(prev[sId] || []), agentMsg]
      }))
    } else {
      const errorMsg = {
        id: `agent-error-${Date.now()}`,
        role: "agent",
        isError: true,
        content: agentRes.error || "Agent loop error: Could not process request.",
        timestamp: Date.now(),
      }

      setSessionMessages(prev => ({
        ...prev,
        [sId]: [...(prev[sId] || []), errorMsg]
      }))
    }
  }

  // Fill (but never auto-send) the chat composer with a prompt, used by the
  // Evaluation Suite modal's "Use Prompt" action.
  const handleFillPrompt = (promptText) => {
    setPrefillPrompt(promptText)
    setPrefillNonce(n => n + 1)
  }

  // Clear messages for current session
  const handleClearMessages = () => {
    if (!selectedSession) return
    const sId = selectedSession.id || selectedSession.session_id
    setSessionMessages(prev => ({
      ...prev,
      [sId]: []
    }))
  }

  // Initial load
  useEffect(() => {
    checkHealth()
    fetchSessions()
  }, [checkHealth, fetchSessions])

  const activeSessionId = selectedSession ? (selectedSession.id || selectedSession.session_id) : null
  const activeMessages = activeSessionId ? (sessionMessages[activeSessionId] || []) : []

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#f5f5f5] text-[#0c0a09] font-sans antialiased selection:bg-[#292524] selection:text-white flex flex-col">
      {/* Agent Studio Top Navigation */}
      <TopNav 
        onOpenCreateSession={() => setIsCreateModalOpen(true)}
        onOpenEvalSuite={() => setIsEvalSuiteOpen(true)}
        onOpenToolRegistry={() => setIsToolRegistryOpen(true)}
        onOpenContextViewer={() => setIsContextViewerOpen(true)}
        healthStatus={healthStatus}
        onRefreshHealth={checkHealth}
      />

      {/* Main Agent Studio Workspace View */}
      <main className="flex-1 flex w-full h-[calc(100vh-56px)] min-h-0 overflow-hidden">
        {/* Agent Sidebar */}
        <AgentSidebar
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
          onOpenCreateSession={() => setIsCreateModalOpen(true)}
          onDeleteSession={handleDeleteSession}
          healthStatus={healthStatus}
          onRefreshHealth={checkHealth}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenContextViewer={() => setIsContextViewerOpen(true)}
          onOpenEvalSuite={() => setIsEvalSuiteOpen(true)}
          onOpenToolRegistry={() => setIsToolRegistryOpen(true)}
        />

        {/* Main Agent Studio Workspace View */}
        <AgentChatView
          session={selectedSession}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          onClearMessages={handleClearMessages}
          isLoading={isAgentResponding}
          healthStatus={healthStatus}
          onRefreshHealth={checkHealth}
          onOpenContextViewer={() => setIsContextViewerOpen(true)}
          onOpenEvalSuite={() => setIsEvalSuiteOpen(true)}
          onOpenToolRegistry={() => setIsToolRegistryOpen(true)}
          prefillPrompt={prefillPrompt}
          prefillNonce={prefillNonce}
        />
      </main>

      {/* Evaluation Suite Benchmark Modal */}
      <EvaluationSuiteModal
        isOpen={isEvalSuiteOpen}
        onClose={() => setIsEvalSuiteOpen(false)}
        onSelectPrompt={handleFillPrompt}
      />

      {/* Registered Tool Registry Modal */}
      <ToolRegistryModal
        isOpen={isToolRegistryOpen}
        onClose={() => setIsToolRegistryOpen(false)}
      />

      {/* Session Context Memory Viewer Modal */}
      <SessionContextViewer
        isOpen={isContextViewerOpen}
        onClose={() => setIsContextViewerOpen(false)}
        session={selectedSession}
      />

      {/* Create New Session Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Agent Session"
        description="Initialize a new session workspace context for your evaluation queries."
      >
        <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4e4e4e] mb-2">
              Session Title
            </label>
            <Input
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="e.g., Category B Aggregation Benchmark"
              autoFocus
            />
            {createError && (
              <p className="text-xs text-rose-600 mt-2">{createError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#e7e5e4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreatingSession}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingSession}
              disabled={!newSessionName.trim()}
            >
              Create Session
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
