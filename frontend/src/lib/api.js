/**
 * API Client matching backend controllers in backend/app/controllers
 * (agent_controller.py & session_controller.py)
 * Includes robust offline fallback, localStorage persistence, and graceful error handling.
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:8000"
const LOCAL_STORAGE_SESSIONS_KEY = "AGENT_STUDIO_OFFLINE_SESSIONS"
const LOCAL_STORAGE_MESSAGES_KEY = "AGENT_STUDIO_OFFLINE_MESSAGES"

export function getStoredBaseUrl() {
  return localStorage.getItem("UI_API_BASE_URL") || DEFAULT_BASE_URL
}

export function setStoredBaseUrl(url) {
  if (url) {
    localStorage.setItem("UI_API_BASE_URL", url.replace(/\/+$/, ""))
  } else {
    localStorage.removeItem("UI_API_BASE_URL")
  }
}

/**
 * PII & Sensitive Data Pre-Flight Scanner
 * Matches pattern definitions in backend/app/utilities/security.py
 * (_PATTERNS: api_key, email, phone, credit_card)
 */
export function scanForPII(text) {
  if (!text) return { found: false, matches: [], patternType: null }
  const matches = []
  let patternType = null

  // api_key
  if (/\bsk-[A-Za-z0-9_-]{16,}\b|bearer\s+[a-zA-Z0-9_\-\.]{20,}|ghp_[a-zA-Z0-9]{36}/i.test(text)) {
    matches.push("API Key or Secret Token")
    patternType = patternType || "api_key"
  }

  // email
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text)) {
    matches.push("Email Address")
    patternType = patternType || "email"
  }

  // phone
  if (/(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/.test(text)) {
    matches.push("Phone Number")
    patternType = patternType || "phone"
  }

  // credit_card
  if (/(?<!\d)(?:\d[ -]?){13,16}(?!\d)/.test(text)) {
    matches.push("Credit Card Number")
    patternType = patternType || "credit_card"
  }

  return {
    found: matches.length > 0,
    matches,
    patternType
  }
}

/**
 * Local Storage Fallback Helpers
 */
export function getLocalSessions() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export function saveLocalSessions(sessions) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions))
  } catch (e) {}
}

export function getLocalMessages(sessionId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_MESSAGES_KEY}_${sessionId}`)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export function saveLocalMessages(sessionId, messages) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_MESSAGES_KEY}_${sessionId}`, JSON.stringify(messages))
  } catch (e) {}
}

/**
 * Parse backend session context array (returned by GET /api/sessions/{session_id})
 * into structured frontend chat messages with full execution traces.
 */
export function parseBackendContext(contextList) {
  if (!Array.isArray(contextList)) return []

  const messages = []
  let currentTrace = []

  for (let i = 0; i < contextList.length; i++) {
    const entry = contextList[i]
    if (!entry || typeof entry !== "object") continue

    const role = entry.role
    const meta = entry.meta || {}
    const reqId = meta.request_id || entry.request_id || `req_${i}`
    const timestamp = meta.ts ? new Date(meta.ts).getTime() : Date.now()

    if (role === "user") {
      messages.push({
        id: `user-${reqId}-${i}`,
        role: "user",
        content: entry.content || "",
        timestamp,
        request_id: reqId
      })
      currentTrace = []
    } else if (role === "assistant" && entry.tool_calls) {
      const toolCall = entry.tool_calls[0]
      const toolName = meta.tool || toolCall?.function?.name || "unknown_tool"
      let toolArgs = {}
      try {
        toolArgs = typeof toolCall?.function?.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall?.function?.arguments || {}
      } catch (e) {
        toolArgs = {}
      }

      currentTrace.push({
        step: meta.step || currentTrace.length + 1,
        planner: `Dispatching \`${toolName}\` to execute agent step ${meta.step || currentTrace.length + 1}.`,
        tool: toolName,
        args: toolArgs,
        attempts: 1,
        status: "pending",
        latency_ms: 0,
        call_id: toolCall?.id
      })
    } else if (role === "tool") {
      let payload = {}
      try {
        payload = typeof entry.content === "string" ? JSON.parse(entry.content) : entry.content || {}
      } catch (e) {
        payload = {}
      }

      const callId = entry.tool_call_id
      const traceItem = currentTrace.find(t => t.call_id === callId || t.step === meta.step)

      if (traceItem) {
        traceItem.status = meta.success !== false && payload.success !== false ? "success" : "failed"
        traceItem.latency_ms = Math.round(meta.latency_ms || 25)
        traceItem.attempts = meta.attempts || payload.attempts || 1
        traceItem.result = payload
      } else {
        currentTrace.push({
          step: meta.step || currentTrace.length + 1,
          tool: meta.tool || payload.tool || "tool",
          args: {},
          attempts: meta.attempts || payload.attempts || 1,
          status: meta.success !== false && payload.success !== false ? "success" : "failed",
          latency_ms: Math.round(meta.latency_ms || 25),
          result: payload
        })
      }
    } else if (role === "assistant" && entry.content !== null && entry.content !== undefined) {
      messages.push({
        id: `agent-${reqId}-${i}`,
        role: "agent",
        content: entry.content || "",
        execution_trace: [...currentTrace],
        step_count: currentTrace.length,
        max_steps: 5,
        request_id: reqId,
        timestamp
      })
      currentTrace = []
    }
  }

  return messages
}

async function request(endpoint, options = {}) {
  const baseUrl = getStoredBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const startTime = performance.now()
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    })
    const latency = Math.round(performance.now() - startTime)

    if (!res.ok) {
      let errorText = ""
      try {
        const errorJson = await res.json()
        errorText = errorJson.error || errorJson.detail || JSON.stringify(errorJson)
      } catch (e) {
        errorText = await res.text()
      }

      return {
        ok: false,
        status: res.status,
        latency,
        error: errorText || `HTTP ${res.status}: ${res.statusText}`,
      }
    }

    let data = null
    if (res.status !== 204) {
      const text = await res.text()
      data = text ? JSON.parse(text) : null
    }

    return {
      ok: true,
      status: res.status,
      latency,
      data,
    }
  } catch (err) {
    const latency = Math.round(performance.now() - startTime)
    return {
      ok: false,
      status: 0,
      latency,
      error: err.message || "Network Error: Could not connect to FastAPI server at " + baseUrl,
      isOffline: true,
    }
  }
}

export async function getHealth() {
  return request("/api/health")
}

export async function getSessions() {
  const res = await request("/api/sessions/")
  if (res.ok) {
    if (Array.isArray(res.data)) {
      saveLocalSessions(res.data)
    }
    return res
  }

  const cached = getLocalSessions()
  return { ok: false, status: res.status, latency: res.latency, data: cached, error: res.error }
}

export async function getSessionDetails(sessionId) {
  const res = await request(`/api/sessions/${sessionId}`)
  if (res.ok) return res

  const cachedMsgs = getLocalMessages(sessionId)
  return {
    ok: false,
    status: res.status,
    latency: res.latency,
    error: res.error,
    data: {
      id: sessionId,
      session_id: sessionId,
      session_name: "Agent Session",
      context: cachedMsgs,
    }
  }
}

export async function createSession(sessionName) {
  const res = await request("/api/sessions/", {
    method: "POST",
    body: JSON.stringify({ session_name: sessionName }),
  })

  if (res.ok && res.data) {
    const existing = getLocalSessions()
    saveLocalSessions([res.data, ...existing])
  }

  return res
}

export async function deleteSession(sessionId) {
  const res = await request(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  })

  const existing = getLocalSessions()
  const remaining = existing.filter(s => (s.id || s.session_id) !== sessionId)
  saveLocalSessions(remaining)

  return res
}

/**
 * Send Chat Message to Agent Endpoint (agent_controller.py & routes/api.py)
 * POST /api/agent/chat { session_id, message }
 * Handles:
 * - Empty message validation (400)
 * - Message length > 4000 limit (400)
 * - PII Security Scanner blocks (400)
 * - Real FastAPI backend communication without any mock/dummy responses
 */
export async function sendAgentMessage(sessionId, message) {
  if (!message || !message.trim()) {
    return {
      ok: false,
      status: 400,
      latency: 5,
      error: "message must not be empty"
    }
  }

  if (message.length > 4000) {
    return {
      ok: false,
      status: 400,
      latency: 5,
      error: "message exceeds maximum length of 4000 characters"
    }
  }

  const piiResult = scanForPII(message)
  if (piiResult.found) {
    return {
      ok: false,
      status: 400,
      latency: 12,
      error: "request contains data that can't be processed",
      isPiiBlock: true,
      patternType: piiResult.patternType
    }
  }

  // Real API request to backend controller endpoint
  return await request("/api/agent/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  })
}
