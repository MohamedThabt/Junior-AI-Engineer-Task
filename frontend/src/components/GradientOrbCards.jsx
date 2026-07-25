import React from "react"
import { Sparkles, Cpu, Layers, Radio, ShieldCheck } from "lucide-react"

export function GradientOrbCards() {
  const cards = [
    {
      orbClass: "orb-mint",
      tag: "Voice Design",
      title: "Atmospheric Voice Synthesis",
      description: "Generative neural models tuned for emotional variance, pacing, and human breath dynamics across broad context windows.",
      token: "#a7e5d3",
    },
    {
      orbClass: "orb-peach",
      tag: "Agent Loops",
      title: "Deterministic Execution",
      titleSerif: "Autonomous Tool Use",
      description: "Seamless agent orchestration connecting text queries directly to Python data stores, SQL engines, and REST endpoints.",
      token: "#f4c5a8",
    },
    {
      orbClass: "orb-lavender",
      tag: "Multilingual AI",
      title: "Localized Nuance in 32 Languages",
      description: "Cross-lingual accent preservation ensuring brand identity remains uniform across global markets.",
      token: "#c8b8e0",
    },
    {
      orbClass: "orb-sky",
      tag: "Speech to Speech",
      title: "Real-time Conversational Latency",
      description: "Ultra-low latency streaming optimized for interactive avatars, IVR phone trees, and live streaming systems.",
      token: "#a8c8e8",
    },
    {
      orbClass: "orb-rose",
      tag: "Safety & Ethics",
      title: "Voice Cloning Safeguards",
      description: "Automated cryptographic watermarking and PII sanitization keeping voice synthesis secure and compliant.",
      token: "#e8b8c4",
    },
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-[#f5f5f5]">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-semibold tracking-[0.96px] text-[#777169] bg-[#f0efed] px-3 py-1 rounded-full border border-[#e7e5e4]">
            Atmospheric Brand Experience
          </span>
          <h2 className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] tracking-[-0.36px]">
            Designed like an editorial publication. Powered by voice intelligence.
          </h2>
        </div>

        {/* Gradient Orb Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-[#fafafa] border border-[#e7e5e4] rounded-xxl p-8 shadow-soft-drop hover:shadow-elevated transition-all duration-300 group flex flex-col justify-between min-h-[300px] ${
                idx === 0 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {/* Soft Radial Gradient Orb (Atmospheric Brand Decoration) */}
              <div
                className={`absolute inset-0 ${card.orbClass} pointer-events-none transition-transform duration-700 group-hover:scale-110 opacity-70`}
              />

              {/* Card Top Tag */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.96px] text-[#0c0a09] bg-[#ffffff]/80 backdrop-blur-xs px-3 py-1 rounded-full border border-[#e7e5e4]">
                  {card.tag}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: card.token }}
                  title="Orb Token"
                />
              </div>

              {/* Card Content Display Copy */}
              <div className="relative z-10 mt-12 space-y-3">
                <h3 className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] tracking-[-0.32px] leading-tight">
                  {card.title}
                </h3>
                <p className="text-sm text-[#4e4e4e] leading-relaxed tracking-[0.16px]">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
