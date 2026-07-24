import React from "react"
import { Cpu, Github, Globe, ExternalLink } from "lucide-react"

export const Footer = () => {
  return (
    <footer className="bg-canvas border-t border-hairline pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1: Brand & Wordmark */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-surface-2 border border-white/20 flex items-center justify-center text-white">
                <Cpu className="w-3.5 h-3.5 text-accent-blue" />
              </div>
              <span className="font-bold text-white tracking-tight uppercase text-sm">AGENCY AI</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              Intelligent Real Estate AI Agent with FastAPI backend, SQLite session persistence, and Framer design system interface.
            </p>
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} AI Engineering Task. Dark mode system by Framer spec.
            </p>
          </div>

          {/* Column 2: Core Stack */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs text-ink-muted">
              <li>FastAPI Backend</li>
              <li>SQLite Storage</li>
              <li>Gradio UI Mount</li>
              <li>LangGraph Controller</li>
              <li>React 18 & Vite</li>
            </ul>
          </div>

          {/* Column 3: API Endpoints */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink mb-4">Endpoints</h4>
            <ul className="space-y-2.5 text-xs text-ink-muted font-mono">
              <li>/api/health</li>
              <li>/api/sessions/</li>
              <li>/api/sessions/{`{id}`}</li>
              <li>/ui (Gradio)</li>
              <li>/docs (OpenAPI)</li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink mb-4">System Links</h4>
            <ul className="space-y-2.5 text-xs text-ink-muted">
              <li>
                <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:text-accent-blue flex items-center">
                  FastAPI Swagger Docs <ExternalLink className="w-3 h-3 ml-1 text-ink-muted" />
                </a>
              </li>
              <li>
                <a href="http://127.0.0.1:8000/ui" target="_blank" rel="noopener noreferrer" className="hover:text-accent-blue flex items-center">
                  Gradio Interface <ExternalLink className="w-3 h-3 ml-1 text-ink-muted" />
                </a>
              </li>
              <li>
                <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent-blue flex items-center">
                  Shadcn UI <ExternalLink className="w-3 h-3 ml-1 text-ink-muted" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-hairline-soft flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted">
          <span>Designed with Framer near-pure black canvas & Sky Blue chromatic accent.</span>
          <span className="mt-2 sm:mt-0">Powered by DeepMind Antigravity AI</span>
        </div>
      </div>
    </footer>
  )
}
