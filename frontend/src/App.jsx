import React, { useState, useEffect, useCallback } from "react"
import { AgentSidebar } from "./components/AgentSidebar"
import { AgentChatView } from "./components/AgentChatView"
import { Modal } from "./components/ui/Modal"
import { Input } from "./components/ui/Input"
import { Button } from "./components/ui/Button"
import { 
  getHealth, 
  getSessions, 
  createSession, 
  deleteSession,
  getStoredBaseUrl,
  setStoredBaseUrl
} from "./lib/api"

export default function App() {
  // Telemetry & Sessions State
  const [healthStatus, setHealthStatus] = useState({ ok: false, latency: 0 })
  const [sessions, setSessions] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  // Chat messages per session state { [sessionId]: [ { id, role, content, timestamp } ] }
  const [sessionMessages, setSessionMessages] = useState({})
  const [isAgentResponding, setIsAgentResponding] = useState(false)

  // Layout UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [createError, setCreateError] = useState(null)

  // API Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customApiUrl, setCustomApiUrl] = useState(getStoredBaseUrl())

  // Check health
  const checkHealth = useCallback(async () => {
    const res = await getHealth()
    setHealthStatus(res)
    return res
  }, [])

  // Fetch sessions list
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    const res = await getSessions()
    setIsLoadingSessions(false)

    if (res.ok && Array.isArray(res.data)) {
      setSessions(res.data)
      if (res.data.length > 0 && !selectedSession) {
        setSelectedSession(res.data[0])
      }
    } else {
      setSessions([])
    }
    return res
  }, [selectedSession])

  // Handle session creation
  const handleCreateSessionSubmit = async (e) => {
    e?.preventDefault()
    if (!newSessionName.trim()) return

    setIsCreatingSession(true)
    setCreateError(null)

    const res = await createSession(newSessionName.trim())
    setIsCreatingSession(false)

    if (res.ok) {
      setNewSessionName("")
      setIsCreateModalOpen(false)
      const updated = await getSessions()
      if (updated.ok && Array.isArray(updated.data)) {
        setSessions(updated.data)
        // Select the newly created session
        const created = updated.data.find(s => s.session_name === newSessionName.trim() || s.id === res.data?.id)
        if (created) setSelectedSession(created)
        else if (updated.data.length > 0) setSelectedSession(updated.data[0])
      }
    } else {
      setCreateError(res.error || "Failed to create session.")
    }
  }

  // Handle session deletion
  const handleDeleteSession = async (sessionId) => {
    const res = await deleteSession(sessionId)
    if (res.ok) {
      if (selectedSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId)
        setSelectedSession(remaining.length > 0 ? remaining[0] : null)
      }
      await fetchSessions()
    }
    return res
  }

  // Handle user sending a prompt message
  const handleSendMessage = async (promptText) => {
    if (!selectedSession || !promptText.trim()) return

    const sId = selectedSession.id
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

    // Simulate Agent Intelligence Response based on context
    setTimeout(() => {
      let responseText = ""

      const lower = promptText.toLowerCase()
      if (lower.includes("health") || lower.includes("diagnostic")) {
        responseText = `System Health Status:\n• API Gateway: ${healthStatus.ok ? "ONLINE (200 OK)" : "OFFLINE"}\n• Latency: ${healthStatus.latency}ms\n• Session Repository: Connected\n• Active Session: ${selectedSession.session_name}`
      } else if (lower.includes("cairo") || lower.includes("real estate") || lower.includes("property")) {
        responseText = `Cairo Real Estate Market Analysis for session "${selectedSession.session_name}":\n\n1. New Cairo & 5th Settlement: High compound demand with average price growth of 18-24% YoY.\n2. 6th of October City: Preferred for mid-to-high residential developments with expanding infrastructure.\n3. New Administrative Capital: Commercial and corporate space demand remains robust.`
      } else if (lower.includes("sql") || lower.includes("query") || lower.includes("database")) {
        responseText = `Here is the SQL query for your session context:\n\n\`\`\`sql\nSELECT session_id, session_name, created_at \nFROM chat_sessions \nWHERE session_id = '${selectedSession.id}' \nORDER BY created_at DESC;\n\`\`\``
      } else {
        responseText = `I have received your prompt regarding "${promptText}".\n\nAs the AI Agent assigned to session **${selectedSession.session_name}**, I am ready to process your domain workflows, analyze data, and assist with backend tasks.`
      }

      const agentMsg = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: responseText,
        timestamp: Date.now(),
      }

      setSessionMessages(prev => ({
        ...prev,
        [sId]: [...(prev[sId] || []), agentMsg]
      }))
      setIsAgentResponding(false)
    }, 900)
  }

  // Clear messages for current session
  const handleClearMessages = () => {
    if (!selectedSession) return
    setSessionMessages(prev => ({
      ...prev,
      [selectedSession.id]: []
    }))
  }

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault()
    setStoredBaseUrl(customApiUrl)
    setIsSettingsOpen(false)
    checkHealth()
    fetchSessions()
  }

  // Initial load
  useEffect(() => {
    checkHealth()
    fetchSessions()
  }, [checkHealth, fetchSessions])

  const activeMessages = selectedSession ? (sessionMessages[selectedSession.id] || []) : []

  return (
    <div className="flex h-screen w-screen bg-canvas text-ink overflow-hidden font-sans antialiased selection:bg-accent-blue/30 selection:text-white">
      {/* Agent Sidebar Component */}
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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Single Page Agent Interface Chat View */}
      <AgentChatView
        session={selectedSession}
        messages={activeMessages}
        onSendMessage={handleSendMessage}
        onClearMessages={handleClearMessages}
        isLoading={isAgentResponding}
        healthStatus={healthStatus}
      />

      {/* Create New Session Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Agent Session"
        description="Initialize a new session workspace context for your agent queries."
      >
        <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">
              Session Title
            </label>
            <Input
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="e.g., Real Estate Portfolio Advisor"
              autoFocus
            />
            {createError && (
              <p className="text-xs text-red-400 mt-2">{createError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
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

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configure Backend API"
        description="Set the base URL for the FastAPI agent backend server."
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">
              API Base Endpoint URL
            </label>
            <Input
              value={customApiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              Save & Test Connection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
