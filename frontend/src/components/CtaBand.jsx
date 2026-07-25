import React from "react"
import { ChevronRight } from "lucide-react"

export function CtaBand({ onOpenStudio }) {
  return (
    <section className="py-[96px] px-4 md:px-8 bg-[#f5f5f5] border-t border-[#e7e5e4] text-center">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Centered Display Headline (36px weight 300 serif) */}
        <h2 className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] tracking-[-0.36px] max-w-2xl mx-auto leading-tight">
          Experience natural voice AI and intelligent agent loops today.
        </h2>

        {/* Single Primary Ink Pill CTA */}
        <div className="pt-2">
          <button
            onClick={onOpenStudio}
            className="px-8 py-3.5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white font-medium text-[15px] shadow-xs transition-all inline-flex items-center gap-2"
          >
            <span>Try Excel Data Assistant Free</span>
            <ChevronRight className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </div>
    </section>
  )
}
