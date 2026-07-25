import React from "react"

export function Footer() {
  return (
    <footer className="bg-[#f5f5f5] text-[#4e4e4e] py-16 px-4 md:px-8 border-t border-[#e7e5e4]">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* 5-Column Link List Desktop Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
          
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-[#0c0a09] text-[11px]">
              Product
            </h4>
            <ul className="space-y-2 text-[#4e4e4e]">
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Text to Speech</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Voice Changer</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Voice Cloning</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">AI Dubbing</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Sound Effects</a></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-[#0c0a09] text-[11px]">
              Solutions
            </h4>
            <ul className="space-y-2 text-[#4e4e4e]">
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Conversational AI</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Audiobooks & Publishing</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Gaming & NPCs</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Video Localization</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Podcasts</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-[#0c0a09] text-[11px]">
              Developers
            </h4>
            <ul className="space-y-2 text-[#4e4e4e]">
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Python SDK</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Node.js SDK</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">GitHub Repos</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Status & Uptime</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-[#0c0a09] text-[11px]">
              Company
            </h4>
            <ul className="space-y-2 text-[#4e4e4e]">
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">About Excel Data Assistant</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Press & Editorial</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Grants Program</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Blog & Research</a></li>
            </ul>
          </div>

          {/* Col 5 */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-[#0c0a09] text-[11px]">
              Legal & Safety
            </h4>
            <ul className="space-y-2 text-[#4e4e4e]">
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Safety Center</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Voice Protection</a></li>
              <li><a href="#" className="hover:text-[#0c0a09] transition-colors">Report Abuse</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-[#e7e5e4] flex flex-col sm:flex-row items-center justify-between text-xs text-[#777169] gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-lg font-light text-[#0c0a09]">Excel Data Assistant</span>
            <span>© 2026 Excel Data Assistant Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-[#0c0a09] cursor-pointer">English (US)</span>
            <span>·</span>
            <span className="hover:text-[#0c0a09] cursor-pointer">System Status: 100% Operational</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
