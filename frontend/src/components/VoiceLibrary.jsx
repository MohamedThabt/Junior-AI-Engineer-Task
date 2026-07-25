import React, { useState } from "react"
import { Play, Pause, Volume2, Sparkles, Filter, ChevronRight } from "lucide-react"

export function VoiceLibrary({ onSelectVoice }) {
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState("All")

  const voices = [
    { id: "v1", name: "Rachel", category: "Conversational", accent: "American", description: "Natural, calm, expressive narrative voice.", gender: "Female", sampleRate: "24kHz" },
    { id: "v2", name: "Clyde", category: "Video Games", accent: "American", description: "Gritty, intense character for games and fiction.", gender: "Male", sampleRate: "24kHz" },
    { id: "v3", name: "Domi", category: "Social Media", accent: "British", description: "Upbeat, energetic, engaging modern voice.", gender: "Female", sampleRate: "24kHz" },
    { id: "v4", name: "Antoni", category: "Narration", accent: "American", description: "Deep, editorial voice ideal for audiobooks.", gender: "Male", sampleRate: "24kHz" },
    { id: "v5", name: "Ellie", category: "Animation", accent: "Australian", description: "Playful, bright, warm storytelling tone.", gender: "Female", sampleRate: "24kHz" },
    { id: "v6", name: "Marcus", category: "News & Doc", accent: "British", description: "Authoritative, precise journalistic voice.", gender: "Male", sampleRate: "24kHz" },
  ]

  const categories = ["All", "Conversational", "Narration", "Video Games", "Social Media", "News & Doc"]

  const filteredVoices = selectedCategory === "All" 
    ? voices 
    : voices.filter(v => v.category === selectedCategory)

  const togglePlay = (id) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null)
    } else {
      setPlayingVoiceId(id)
    }
  }

  return (
    <section id="voices" className="py-20 px-4 md:px-8 bg-[#fafafa] border-y border-[#e7e5e4]">
      <div className="max-w-[1200px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase font-semibold tracking-[0.96px] text-[#777169] bg-[#f0efed] px-3 py-1 rounded-full border border-[#e7e5e4]">
              Voice Library & Models
            </span>
            <h2 className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] tracking-[-0.36px]">
              Curated default voices for every medium.
            </h2>
          </div>

          {/* Filter Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#292524] text-white shadow-xs"
                    : "bg-[#ffffff] text-[#4e4e4e] border border-[#e7e5e4] hover:text-[#0c0a09] hover:border-[#d6d3d1]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Voice List Table/Rows */}
        <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-2xl divide-y divide-[#e7e5e4] shadow-soft-drop overflow-hidden">
          {filteredVoices.map((voice) => {
            const isPlaying = playingVoiceId === voice.id
            return (
              <div
                key={voice.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors group"
              >
                {/* Left: 32px Circular Voice Icon Plate + Details */}
                <div className="flex items-center space-x-4 min-w-0">
                  {/* voice-icon-circular */}
                  <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#0c0a09] font-medium text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-[#292524] group-hover:text-white transition-colors">
                    {voice.name[0]}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-[#0c0a09] truncate">
                        {voice.name}
                      </h4>
                      <span className="text-[10px] font-medium text-[#4e4e4e] bg-[#f0efed] px-2 py-0.5 rounded-full">
                        {voice.accent}
                      </span>
                      <span className="hidden sm:inline-block text-[10px] text-[#777169] border border-[#e7e5e4] px-2 py-0.5 rounded-full">
                        {voice.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#777169] truncate max-w-md">
                      {voice.description}
                    </p>
                  </div>
                </div>

                {/* Right: Play Preview Button + CTA */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="hidden md:inline-block text-xs font-mono text-[#a8a29e]">
                    {voice.sampleRate}
                  </span>

                  <button
                    onClick={() => togglePlay(voice.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isPlaying
                        ? "bg-[#0c0a09] text-white"
                        : "bg-[#f0efed] text-[#0c0a09] hover:bg-[#292524] hover:text-white"
                    }`}
                    title={isPlaying ? "Pause" : "Play Voice Preview"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
