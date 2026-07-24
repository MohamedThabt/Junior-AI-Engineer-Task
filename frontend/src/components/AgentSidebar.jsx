import React, { useState } from "react"
import { 
  Bot, 
  Plus, 
  Trash2, 
  MessageSquare, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Server,
  SlidersHorizontal,
  Wrench,
  Database,
  Cpu
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export function AgentSidebar({
  sessions = [],
  selectedSession,
  onSelectSession,
  onOpenCreateSession,
  onDeleteSession,
  healthStatus,
  onRefreshHealth,
  isCollapsed,
  setIsCollapsed,
  onOpenSettings,
  onOpenToolsDrawer,
  onOpenDataDrawer,
  onOpenContextViewer,
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSessions = sessions.filter(s => 
    s.session_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <aside 
      className={`relative flex flex-col h-full bg-[#09090b] border-r border-zinc-800/80 transition-all duration-200 z-20 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5">
            <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
              <h1 className="font-sans font-semibold text-xs text-white tracking-tight leading-none">
                AI Agent Studio
              </h1>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${healthStatus.ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {healthStatus.ok ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Session Button */}
      <div className="p-3">
        {isCollapsed ? (
          <button
            onClick={onOpenCreateSession}
            className="w-full h-9 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white flex items-center justify-center transition-colors text-xs font-medium"
            title="Create New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onOpenCreateSession}
            className="w-full py-2 px-3 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white flex items-center justify-center gap-2 text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        )}
      </div>

      {/* Quick Agent Inspector Tools Navigation */}
      {!isCollapsed && (
        <div className="px-3 pb-2 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Agent Tools & Schemas
          </div>

          <button
            onClick={onOpenToolsDrawer}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-300 transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>Tools Inventory (9)</span>
          </button>

          <button
            onClick={onOpenDataDrawer}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-300 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Database Tables</span>
          </button>

          {selectedSession && (
            <button
              onClick={onOpenContextViewer}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-300 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Memory State</span>
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      {!isCollapsed && sessions.length > 0 && (
        <div className="px-3 pb-2 pt-1 border-t border-zinc-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 text-zinc-200 text-xs pl-8 pr-3 py-1.5 rounded-md border border-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {!isCollapsed && (
          <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Sessions ({filteredSessions.length})
          </div>
        )}

        {filteredSessions.length === 0 ? (
          !isCollapsed && (
            <div className="p-6 text-center text-zinc-500 text-xs space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto text-zinc-700" />
              <p>No active sessions.</p>
              <button 
                onClick={onOpenCreateSession}
                className="text-zinc-300 hover:text-white hover:underline text-xs"
              >
                Create one
              </button>
            </div>
          )
        ) : (
          filteredSessions.map((session) => {
            const isSelected = selectedSession?.id === session.id
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group relative flex items-center rounded-md transition-colors cursor-pointer ${
                  isCollapsed ? "justify-center p-2" : "px-2.5 py-2"
                } ${
                  isSelected
                    ? "bg-zinc-800/80 text-white font-medium"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`}
                title={session.session_name}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-cyan-400" : "text-zinc-500"}`} />

                {!isCollapsed && (
                  <div className="ml-2.5 flex-1 min-w-0 pr-5">
                    <p className="text-xs truncate leading-tight">
                      {session.session_name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                )}

                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-700/50 rounded transition-all absolute right-1.5"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer Status Telemetry */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
        {isCollapsed ? (
          <button
            onClick={onRefreshHealth}
            className="w-full p-1.5 rounded-md text-zinc-500 hover:text-white flex justify-center"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px] flex items-center gap-1.5 font-medium">
                <Server className="w-3.5 h-3.5 text-zinc-300" />
                Backend Gateway
              </span>
              <button
                onClick={onRefreshHealth}
                className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${healthStatus.ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="font-mono text-[11px] text-zinc-300">
                  {healthStatus.ok ? "Healthy" : "Offline"}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {healthStatus.latency}ms
              </span>
            </div>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" />
                API Settings
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
