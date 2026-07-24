import React, { useState } from "react"
import { MessageSquare, Plus, Trash2, RefreshCw, Search, Calendar, Hash, ArrowUpRight, Check, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Badge } from "./ui/Badge"
import { Modal } from "./ui/Modal"
import { formatDate } from "@/lib/utils"

export const SessionManager = ({
  sessions = [],
  isLoading,
  onRefresh,
  onCreateSession,
  onDeleteSession,
  selectedSession,
  onSelectSession
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [newSessionName, setNewSessionName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const presets = [
    "Real Estate Listing Search",
    "Campaign Marketing Generator",
    "Property Market Analysis",
    "Excel Spreadsheet Processor",
  ]

  const filteredSessions = sessions.filter(
    (s) =>
      s.session_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!newSessionName.trim()) return

    setIsCreating(true)
    setFeedback(null)
    const result = await onCreateSession(newSessionName.trim())
    setIsCreating(false)

    if (result.ok) {
      setNewSessionName("")
      setFeedback({ type: "success", message: `Session created successfully!` })
      setTimeout(() => setFeedback(null), 4000)
    } else {
      setFeedback({ type: "error", message: result.error || "Failed to create session" })
    }
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return
    setIsDeleting(true)
    const res = await onDeleteSession(sessionToDelete.id)
    setIsDeleting(false)
    setSessionToDelete(null)

    if (res.ok) {
      setFeedback({ type: "success", message: `Session deleted successfully.` })
      setTimeout(() => setFeedback(null), 4000)
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to delete session." })
    }
  }

  return (
    <section id="sessions-section" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-hairline">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="default" className="mb-3">
              SESSION MANAGEMENT
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-display-lg text-ink">
              Chat & Agent Sessions
            </h2>
            <p className="text-sm text-ink-muted mt-1 max-w-xl">
              Create, view, and switch between persistent execution state sessions backed by SQLite database endpoints.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              isLoading={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-red-950/40 border-red-800/60 text-red-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Create New Session Form (5 cols) */}
          <div className="lg:col-span-5">
            <Card variant="featured" className="h-full flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-3">
                    <Plus className="w-5 h-5 text-accent-blue" />
                  </div>
                  <CardTitle>Create New Session</CardTitle>
                  <CardDescription>
                    Initialize a new conversation context for the AI agent executor.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-2">
                      Session Name
                    </label>
                    <Input
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="e.g., Cairo Real Estate Query..."
                      disabled={isCreating}
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-2">
                      Quick Templates
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewSessionName(preset)}
                          className="text-xs bg-surface-1 border border-white/10 hover:border-accent-blue/50 text-white/80 px-2.5 py-1 rounded-md transition-all text-left"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full mt-4"
                    isLoading={isCreating}
                    disabled={!newSessionName.trim()}
                  >
                    Create Session
                  </Button>
                </form>
              </div>

              {/* Tips note */}
              <div className="mt-8 pt-4 border-t border-white/5 text-xs text-ink-muted">
                <span className="text-accent-blue font-medium">Pro-tip:</span> Sessions persist prompt histories and active tool memory states across reboots.
              </div>
            </Card>
          </div>

          {/* Right Column: Sessions List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search and Filters Bar */}
            <div className="flex items-center space-x-3">
              <Input
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions by name or ID..."
              />
            </div>

            {/* Session Cards Container */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="p-12 text-center bg-surface-1 rounded-xl border border-white/10">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent-blue mb-2" />
                  <p className="text-sm text-ink-muted">Fetching chat sessions from backend...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-12 text-center bg-surface-1 rounded-xl border border-white/10">
                  <MessageSquare className="w-8 h-8 mx-auto text-ink-muted/50 mb-3" />
                  <h4 className="text-base font-medium text-white">No Sessions Found</h4>
                  <p className="text-xs text-ink-muted mt-1">
                    {searchQuery ? "No matching session found for search." : "Create your first chat session using the form on the left."}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession && onSelectSession(session)}
                      className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-surface-2 border-accent-blue/60 shadow-framer-focus"
                          : "bg-surface-1 border-white/10 hover:border-white/25 hover:bg-surface-2/60"
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-accent-blue text-white" : "bg-surface-2 text-ink-muted border border-white/10"
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-white tracking-tight truncate group-hover:text-accent-blue transition-colors">
                            {session.session_name || "Untitled Session"}
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-ink-muted mt-1">
                            <span className="flex items-center font-mono text-[11px]">
                              <Hash className="w-3 h-3 mr-0.5" />
                              {session.id?.substring(0, 8)}...
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(session.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isSelected && (
                          <Badge variant="sky">Active</Badge>
                        )}
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete(session)
                          }}
                          className="hover:text-red-400 opacity-60 hover:opacity-100"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="text-right text-xs text-ink-muted">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </div>

          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title="Delete Chat Session"
        description="Are you sure you want to permanently delete this chat session?"
      >
        {sessionToDelete && (
          <div className="space-y-4">
            <div className="p-3 bg-surface-2 border border-white/10 rounded-lg text-sm">
              <p className="font-medium text-white">{sessionToDelete.session_name}</p>
              <p className="text-xs font-mono text-ink-muted mt-1">ID: {sessionToDelete.id}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                isLoading={isDeleting}
              >
                Delete Session
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
