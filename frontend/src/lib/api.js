/**
 * API Client matching the Gradio backend interface in ui/api_client.py
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:8000"

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
      const errorText = await res.text()
      return {
        ok: false,
        status: res.status,
        latency,
        error: `HTTP ${res.status}: ${errorText || res.statusText}`,
      }
    }

    let data = null
    if (res.status !== 24) {
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
      error: err.message || "Network Error: Could not connect to API server",
    }
  }
}

export async function getHealth() {
  return request("/api/health")
}

export async function getSessions() {
  return request("/api/sessions/")
}

export async function createSession(sessionName) {
  return request("/api/sessions/", {
    method: "POST",
    body: JSON.stringify({ session_name: sessionName }),
  })
}

export async function deleteSession(sessionId) {
  return request(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  })
}
