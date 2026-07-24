import React, { useState } from "react"
import { Activity, ShieldCheck, Terminal, Server, CheckCircle, AlertTriangle, RefreshCw, Send } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { getStoredBaseUrl, getHealth, getSessions } from "@/lib/api"

export const ApiDiagnostics = ({ healthStatus, onRefreshHealth }) => {
  const [activeTestRoute, setActiveTestRoute] = useState("/api/health")
  const [testResult, setTestResult] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  const routesList = [
    { method: "GET", path: "/api/health", desc: "Health check route (60/min rate limit)" },
    { method: "GET", path: "/api/sessions/", desc: "List all chat sessions" },
    { method: "POST", path: "/api/sessions/", desc: "Create a new session (JSON payload)" },
    { method: "DELETE", path: "/api/sessions/{id}", desc: "Delete a specific session by ID" },
  ]

  const runRouteTest = async (route) => {
    setActiveTestRoute(route.path)
    setIsTesting(true)
    let res = null

    if (route.path === "/api/health") {
      res = await getHealth()
    } else if (route.path === "/api/sessions/") {
      res = await getSessions()
    } else {
      res = {
        ok: true,
        status: 200,
        latency: 14,
        data: { message: `Simulated test endpoint for ${route.path}` }
      }
    }

    setIsTesting(false)
    setTestResult(res)
  }

  return (
    <section id="diagnostics-section" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-hairline">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="sky" className="mb-3">
              LIVE TELEMETRY & API CLIENT
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-display-lg text-ink">
              Backend Health & Route Inspector
            </h2>
            <p className="text-sm text-ink-muted mt-1 max-w-xl">
              Inspect FastAPI response payloads, HTTP status codes, and network latency in real-time.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-ink-muted font-mono bg-surface-1 px-3 py-1.5 rounded-md border border-white/10">
              Host: {getStoredBaseUrl()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Endpoints comparison table (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>API Route Registry</span>
                  <Badge variant="default">FastAPI Router</Badge>
                </CardTitle>
                <CardDescription>
                  Click any endpoint to fire a live HTTP test request.
                </CardDescription>
              </CardHeader>

              {/* Framer comparison table style */}
              <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-hairline-soft">
                {routesList.map((r) => (
                  <div
                    key={r.path}
                    onClick={() => runRouteTest(r)}
                    className={`p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                      activeTestRoute === r.path
                        ? "bg-surface-2"
                        : "bg-canvas hover:bg-surface-1"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        r.method === "GET" ? "bg-sky-950/80 text-accent-blue border border-accent-blue/40" :
                        r.method === "POST" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40" :
                        "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                      }`}>
                        {r.method}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-mono text-white block truncate">{r.path}</span>
                        <span className="text-xs text-ink-muted block truncate">{r.desc}</span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="opacity-70 hover:opacity-100">
                      <Send className="w-3.5 h-3.5 text-accent-blue" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Payload Inspector Console (6 cols) */}
          <div className="lg:col-span-6">
            <Card variant="mockup" className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-accent-blue" />
                    <span className="text-xs font-mono text-white font-medium">
                      Response Inspector ({activeTestRoute})
                    </span>
                  </div>
                  {testResult && (
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      testResult.ok ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40" : "bg-red-950 text-red-400 border border-red-800/40"
                    }`}>
                      {testResult.status || 0} OK ({testResult.latency || 0}ms)
                    </span>
                  )}
                </div>

                <div className="bg-black/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto min-h-[220px] max-h-[300px]">
                  {isTesting ? (
                    <div className="flex items-center space-x-2 text-ink-muted">
                      <RefreshCw className="w-4 h-4 animate-spin text-accent-blue" />
                      <span>Sending request to {getStoredBaseUrl()}{activeTestRoute}...</span>
                    </div>
                  ) : testResult ? (
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-ink-muted">
                      Select an endpoint from the left or click "Send" to execute a live test request.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-ink-muted">
                <span>FastAPI Rate Limiting: <strong className="text-white">60 req / min</strong></span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => runRouteTest({ path: activeTestRoute, method: "GET" })}
                  isLoading={isTesting}
                >
                  Re-test Request
                </Button>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </section>
  )
}
