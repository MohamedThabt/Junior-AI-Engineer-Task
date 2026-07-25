import React, { useState } from "react"
import { 
  DatabaseZap, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  FlaskConical,
  Wrench,
  Cpu
} from "lucide-react"
import { formatDate } from "../lib/utils"

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
  onOpenContextViewer,
  onOpenEvalSuite,
  onOpenToolRegistry
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSessions = sessions.filter(s => 
    s.session_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <aside 
      className={`relative flex flex-col h-full min-h-0 bg-slate-50 border-r border-slate-200 transition-all duration-200 z-20 flex-shrink-0 font-sans ${
        isCollapsed ? "w-14" : "w-64 xl:w-72"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-[56px] px-3.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className="w-6.5 h-6.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-2xs">
              <DatabaseZap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-bold text-xs text-slate-900 tracking-tight">
              Workspace Sessions
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-6.5 h-6.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-2xs">
              <DatabaseZap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* New Session CTA */}
          <div className="p-3 border-b border-slate-200 bg-white flex-shrink-0">
            <button
              onClick={onOpenCreateSession}
              className="w-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Session</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 transition-all font-sans"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">
                No active sessions
              </div>
            ) : (
              filteredSessions.map((session) => {
                const sId = session.id || session.session_id
                const isSelected = selectedSession && (selectedSession.id === sId || selectedSession.session_id === sId)
                
                return (
                  <div
                    key={sId}
                    onClick={() => onSelectSession(session)}
                    className={`group relative p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs font-sans ${
                      isSelected
                        ? "bg-white text-slate-900 font-semibold border border-slate-200 shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      <div className="truncate">
                        <div className="truncate text-xs font-medium">{session.session_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatDate(session.created_at)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(sId)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Minimal Footer Triggers */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-around text-xs text-slate-500 flex-shrink-0">
            <button 
              onClick={onOpenEvalSuite} 
              className="hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-all"
              title="Eval Suite"
            >
              <FlaskConical className="w-4 h-4 text-purple-600" />
            </button>
            <button 
              onClick={onOpenToolRegistry} 
              className="hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-all"
              title="Tools & Specs"
            >
              <Wrench className="w-4 h-4 text-blue-600" />
            </button>
            <button 
              onClick={onOpenContextViewer} 
              className="hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-all"
              title="DB Context Memory"
            >
              <Cpu className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
