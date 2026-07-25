import React from "react"
import { Check, Sparkles, ChevronRight } from "lucide-react"

export function PricingTiers({ onOpenStudio }) {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For individuals looking to experiment with AI speech synthesis.",
      features: [
        "10,000 text characters / month",
        "3 custom voice clones",
        "Access to default voice library",
        "API rate limit: 10 req/min",
      ],
      featured: false,
      ctaText: "Start for free",
    },
    {
      name: "Pro",
      price: "$22",
      period: "per month",
      description: "For creators and developers building conversational agents.",
      features: [
        "100,000 text characters / month",
        "30 custom voice clones",
        "24kHz Studio quality audio",
        "Agent Loop API & Python SDK",
        "Commercial usage license",
      ],
      featured: true, // Featured dark inversion: surface-dark #0c0a09
      ctaText: "Get Pro Access",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "annual billing",
      description: "Custom volume scale, dedicated support, and strict compliance.",
      features: [
        "Unlimited custom character scale",
        "Zero data retention SLA",
        "Dedicated account manager",
        "Custom voice model training",
        "SOC2 & HIPAA compliance",
      ],
      featured: false,
      ctaText: "Contact Sales",
    },
  ]

  return (
    <section id="pricing" className="py-24 px-4 md:px-8 bg-[#f5f5f5]">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-semibold tracking-[0.96px] text-[#777169] bg-[#f0efed] px-3 py-1 rounded-full border border-[#e7e5e4]">
            Transparent Pricing
          </span>
          <h2 className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] tracking-[-0.36px]">
            Simple plans for creators, agents, and enterprise teams.
          </h2>
        </div>

        {/* 3 Pricing Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-8 transition-all flex flex-col justify-between space-y-8 ${
                tier.featured
                  ? "bg-[#0c0a09] text-white shadow-elevated" // Dark inversion tier
                  : "bg-[#ffffff] text-[#0c0a09] border border-[#e7e5e4] shadow-soft-drop"
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={`font-serif text-2xl font-light ${tier.featured ? "text-white" : "text-[#0c0a09]"}`}>
                    {tier.name}
                  </h3>
                  {tier.featured && (
                    <span className="text-[10px] uppercase font-semibold tracking-[0.96px] px-2.5 py-1 rounded-full bg-[#1c1917] text-white border border-white/10">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline space-x-1">
                    <span className="font-serif text-4xl sm:text-5xl font-light">{tier.price}</span>
                    <span className={`text-xs ${tier.featured ? "text-[#a8a29e]" : "text-[#777169]"}`}>/{tier.period}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${tier.featured ? "text-[#a8a29e]" : "text-[#4e4e4e]"}`}>
                    {tier.description}
                  </p>
                </div>

                <div className={`pt-4 border-t space-y-3 ${tier.featured ? "border-white/10" : "border-[#f0efed]"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${tier.featured ? "text-white" : "text-[#0c0a09]"}`}>
                    Includes:
                  </p>
                  <ul className="space-y-2.5 text-xs">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2.5">
                        <Check className={`w-4 h-4 flex-shrink-0 ${tier.featured ? "text-white" : "text-[#0c0a09]"}`} />
                        <span className={tier.featured ? "text-white/90" : "text-[#4e4e4e]"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={onOpenStudio}
                className={`w-full py-3 px-4 rounded-full font-medium text-xs transition-all flex items-center justify-center space-x-1.5 ${
                  tier.featured
                    ? "bg-[#ffffff] text-[#0c0a09] hover:bg-[#fafafa]"
                    : "bg-[#292524] text-white hover:bg-[#0c0a09]"
                }`}
              >
                <span>{tier.ctaText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
