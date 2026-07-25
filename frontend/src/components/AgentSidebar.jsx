import React, { useState } from "react"
import { 
  BrainCircuit, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal,
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
  onOpenSettings,
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
      className={`relative flex flex-col h-full min-h-0 bg-[#f5f5f5] border-r border-[#e7e5e4] transition-all duration-200 z-20 flex-shrink-0 ${
        isCollapsed ? "w-14" : "w-64 xl:w-72"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-[#e7e5e4] flex items-center justify-between flex-shrink-0 bg-[#ffffff]">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <div className="w-5.5 h-5.5 rounded-lg bg-gradient-to-br from-[#292524] to-[#0c0a09] flex items-center justify-center text-white">
              <BrainCircuit className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="font-serif text-xs font-semibold text-[#0c0a09]">
              Workspace Sessions
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-5.5 h-5.5 rounded-lg bg-gradient-to-br from-[#292524] to-[#0c0a09] flex items-center justify-center text-white">
              <BrainCircuit className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full text-[#777169] hover:text-[#0c0a09] hover:bg-[#f0efed] transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* New Session CTA */}
          <div className="p-3 border-b border-[#e7e5e4] bg-[#ffffff] flex-shrink-0">
            <button
              onClick={onOpenCreateSession}
              className="w-full text-xs font-medium text-white bg-[#292524] hover:bg-[#0c0a09] py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>New Session</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-[#e7e5e4] flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777169]" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#ffffff] text-[#0c0a09] text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#e7e5e4] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#777169]">
                No sessions found
              </div>
            ) : (
              filteredSessions.map((session) => {
                const sId = session.id || session.session_id
                const isSelected = selectedSession && (selectedSession.id === sId || selectedSession.session_id === sId)
                
                return (
                  <div
                    key={sId}
                    onClick={() => onSelectSession(session)}
                    className={`group relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-[#ffffff] text-[#0c0a09] font-medium border border-[#e7e5e4] shadow-2xs"
                        : "text-[#4e4e4e] hover:bg-[#ffffff] hover:text-[#0c0a09]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#777169]" />
                      <div className="truncate">
                        <div className="truncate font-normal text-xs">{session.session_name}</div>
                        <div className="text-[10px] text-[#777169] font-mono">
                          {formatDate(session.created_at)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(sId)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#f0efed] text-[#777169] hover:text-rose-600 transition-opacity"
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
          <div className="p-3 border-t border-[#e7e5e4] bg-[#ffffff] flex items-center justify-around text-xs text-[#777169] flex-shrink-0">
            <button 
              onClick={onOpenEvalSuite} 
              className="hover:text-[#0c0a09] transition-colors p-1"
              title="Eval Suite"
            >
              <FlaskConical className="w-4 h-4 text-purple-600" />
            </button>
            <button 
              onClick={onOpenToolRegistry} 
              className="hover:text-[#0c0a09] transition-colors p-1"
              title="Tools & Specs"
            >
              <Wrench className="w-4 h-4 text-blue-600" />
            </button>
            <button 
              onClick={onOpenContextViewer} 
              className="hover:text-[#0c0a09] transition-colors p-1"
              title="DB Context Memory"
            >
              <Cpu className="w-4 h-4 text-[#292524]" />
            </button>
            <button 
              onClick={onOpenSettings} 
              className="hover:text-[#0c0a09] transition-colors p-1"
              title="API Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
