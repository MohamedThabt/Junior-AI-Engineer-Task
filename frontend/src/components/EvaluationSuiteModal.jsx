import React, { useState } from "react"
import { Modal } from "./ui/Modal"
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Database, 
  ShieldAlert, 
  Zap, 
  ArrowRight,
  Filter,
  Search,
  BookOpen
} from "lucide-react"

export const EVALUATION_CASES = [
  {
    id: "A1",
    category: "Category A — Smoke Tests",
    catId: "A",
    title: "A1. Real-estate query by city + status",
    prompt: "List the active listings in Seattle.",
    capability: "Basic single-tool filtering on real_estate_listings",
    tools: ["query_real_estate", "finalize"],
    expected: "Calls query_real_estate with city='Seattle' & listing_status='Active'. Returns 10 listings (LST-5039, LST-5113, LST-5296...).",
    groundTruth: "10 active Seattle listings ($5,745,000 total list price)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A2",
    category: "Category A — Smoke Tests",
    catId: "A",
    title: "A2. Campaign query by channel",
    prompt: "Show me the LinkedIn campaigns.",
    capability: "Filtering campaigns by channel & acknowledging 50-row cap",
    tools: ["query_campaigns", "finalize"],
    expected: "One query call; answers with LinkedIn campaigns and explicitly mentions result is capped at 50 subset out of 174 total.",
    groundTruth: "174 LinkedIn campaigns (returns max 50 rows)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A3",
    category: "Category A — Smoke Tests",
    catId: "A",
    title: "A3. Query with numeric price range",
    prompt: "Which listings in Illinois are priced under $300,000?",
    capability: "Multi-field numeric range query",
    tools: ["query_real_estate", "finalize"],
    expected: "query_real_estate with state='Illinois' & max_price=300000. Returns matching rows.",
    groundTruth: "Filtered Illinois listings under $300k",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A4",
    category: "Category A — Smoke Tests",
    catId: "A",
    title: "A4. Empty result honesty",
    prompt: "Show me any listings in Hawaii.",
    capability: "Honest empty result handling (Rule 5)",
    tools: ["query_real_estate", "finalize"],
    expected: "query_real_estate returns 0 rows; agent states plainly none exist. Must NOT hallucinate rows.",
    groundTruth: "0 listings in Hawaii",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "B1",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    title: "B1. COUNT aggregation within cap",
    prompt: "How many active listings are there in Illinois?",
    capability: "Post-query counting under 50-row limit",
    tools: ["query_real_estate", "finalize"],
    expected: "Queries active Illinois listings and counts returned rows.",
    groundTruth: "43 active listings in Illinois (fits under cap)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "B2",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    title: "B2. AVG over large category (Cap Caveat)",
    prompt: "What's the average list price of condos?",
    capability: "Post-query average computation + cap awareness",
    tools: ["query_real_estate", "finalize"],
    expected: "Queries condos (194 exist) and explicitly acknowledges average (~$273,546) is based on max 50-row sample read.",
    groundTruth: "avg ≈ $273,546.39 over 194 condos (capped at 50 sample rows)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "B3",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    title: "B3. SUM within cap limit",
    prompt: "What is the total list price of all active listings in Seattle?",
    capability: "Exact summation over fully retrieved subset",
    tools: ["query_real_estate", "finalize"],
    expected: "Queries 10 active Seattle listings and calculates exact total sum.",
    groundTruth: "$5,745,000 USD",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "B4",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    title: "B4. MAX / Superlative search",
    prompt: "Which single listing has the highest list price, and what is it?",
    capability: "Superlative finding without global sort tool",
    tools: ["query_real_estate", "finalize"],
    expected: "Narrows search or acknowledges partial sample limits. Finds global maximum listing.",
    groundTruth: "LST-5470 in San Francisco at $1,918,000 USD",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "B5",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    title: "B5. Cross-field ratio (ROAS)",
    prompt: "For the campaign CMP-8004, what's its return on ad spend (revenue ÷ amount spent)?",
    capability: "Derived single-record arithmetic",
    tools: ["query_campaigns", "finalize"],
    expected: "Reads CMP-8004 ($81,059.73 revenue / $11,223.20 spent) and divides accurately.",
    groundTruth: "81059.73 / 11223.20 ≈ 7.22× ROAS",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "C1",
    category: "Category C — Non-Existent Error Handling",
    catId: "C",
    title: "C1. Delete non-existent listing",
    prompt: "Delete listing LST-9999.",
    capability: "Handling success=False & surfacing non-existent ID error",
    tools: ["delete_real_estate", "finalize"],
    expected: "Tool returns error 'listing_id LST-9999 not found'. Agent finalizes explaining nothing was deleted.",
    groundTruth: "LST-9999 not found (Seed range: LST-5001 to LST-6000)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
  },
  {
    id: "C2",
    category: "Category C — Non-Existent Error Handling",
    catId: "C",
    title: "C2. Remove non-existent campaign",
    prompt: "Remove campaign CMP-0001 from the system.",
    capability: "Surfacing backend error without hallucinating success",
    tools: ["delete_campaign", "finalize"],
    expected: "Reports campaign CMP-0001 does not exist.",
    groundTruth: "CMP-0001 not found (Seed range: CMP-8001 to CMP-9000)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
  },
  {
    id: "C3",
    category: "Category C — Non-Existent Error Handling",
    catId: "C",
    title: "C3. Update non-existent record",
    prompt: "Set the list price of LST-7777 to $500,000.",
    capability: "Surfacing record missing error on update",
    tools: ["update_real_estate", "finalize"],
    expected: "Reports record LST-7777 not found; does not claim update succeeded.",
    groundTruth: "LST-7777 not found",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
  },
  {
    id: "C4",
    category: "Category C — Non-Existent Error Handling",
    catId: "C",
    title: "C4. Malformed ID format validation",
    prompt: "Delete listing number 42.",
    capability: "Argument validation (Pydantic regex LST-\\d+ pattern)",
    tools: ["delete_real_estate", "finalize"],
    expected: "Recognizes '42' is invalid ID format (must be LST-XXXX) and requests valid PK.",
    groundTruth: "Validation error: invalid format '42'",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
  },
  {
    id: "D1",
    category: "Category D — Ambiguous Delete Clarification",
    catId: "D",
    title: "D1. Delete by shared campaign name (7 matches)",
    prompt: "Delete the campaign called 'Referral Program - Google Ads 2024 Q3'.",
    capability: "Rule 3 enforcement: PK-only delete clarification",
    tools: ["query_campaigns", "finalize"],
    expected: "Queries name, finds 7 matching campaign IDs, and asks user which specific campaign_id to delete.",
    groundTruth: "7 candidates (CMP-8176, CMP-8224, CMP-8336...). Zero deletions without PK.",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    id: "D2",
    category: "Category D — Ambiguous Delete Clarification",
    catId: "D",
    title: "D2. Delete 'the Aurora listing' (43 matches)",
    prompt: "Delete the Aurora listing.",
    capability: "Rule 3: Clarification request on ambiguous non-PK target",
    tools: ["query_real_estate", "finalize"],
    expected: "Discovers 43 listings in Aurora; finalizes asking user for exact listing_id.",
    groundTruth: "43 Aurora listings found; requires exact PK choice",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    id: "D3",
    category: "Category D — Ambiguous Delete Clarification",
    catId: "D",
    title: "D3. Delete all Sold listings (Bulk mass request)",
    prompt: "Delete all the listings that have already been sold.",
    capability: "Refusing bulk/filter deletions",
    tools: ["finalize"],
    expected: "Explains agent only has PK-based single deletion and lacks bulk delete tool.",
    groundTruth: "473 Sold listings. Refuses mass deletion without explicit PKs.",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    id: "D4",
    category: "Category D — Ambiguous Delete Clarification",
    catId: "D",
    title: "D4. Unambiguous exact PK delete (Control)",
    prompt: "Delete campaign CMP-8003.",
    capability: "Direct execution when exact PK is provided",
    tools: ["delete_campaign", "finalize"],
    expected: "Executes delete_campaign with campaign_id='CMP-8003' directly.",
    groundTruth: "CMP-8003 deleted successfully",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    id: "E1",
    category: "Category E — Out of Scope Integrity",
    catId: "E",
    title: "E1. Non-existent column (Swimming Pool)",
    prompt: "Which listings have a swimming pool?",
    capability: "Rule 5: No inventing data for non-existent columns",
    tools: ["finalize"],
    expected: "Explains real_estate_listings schema has no pool/amenities column.",
    groundTruth: "Column 'swimming_pool' does not exist",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "E2",
    category: "Category E — Out of Scope Integrity",
    catId: "E",
    title: "E2. Non-existent table (Agents & Commissions)",
    prompt: "List all the agents and their commission rates.",
    capability: "Recognizing domain boundary (only listings & campaigns)",
    tools: ["finalize"],
    expected: "Explains only real_estate_listings and marketing_campaigns tables exist.",
    groundTruth: "No agents/brokers table in system",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "E4",
    category: "Category E — Out of Scope Integrity",
    catId: "E",
    title: "E4. Missing FK/Join capability",
    prompt: "Which marketing campaign generated the sales for listing LST-5002?",
    capability: "Honesty about unlinked independent tables",
    tools: ["finalize"],
    expected: "Explains datasets are unrelated and no foreign key exists to link listings to campaigns.",
    groundTruth: "No FK relation between listings & campaigns",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "E7",
    category: "Category E — Out of Scope Integrity",
    catId: "E",
    title: "E7. Schema & capability probe",
    prompt: "What can you help me with?",
    capability: "Rule 1: Answering capability questions without wasting tool steps",
    tools: ["finalize"],
    expected: "Summarizes the 2 datasets and 8 data tools without burning a query tool step.",
    groundTruth: "System prompt capability self-knowledge",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "F1",
    category: "Category F — Multi-Step & Budget Pressure",
    catId: "F",
    title: "F1. Two-table request within 5-step budget",
    prompt: "How many Google Ads campaigns are there, and how many active listings are in Washington?",
    capability: "Multi-tool dispatch within MAX_STEPS=5",
    tools: ["query_campaigns", "query_real_estate", "finalize"],
    expected: "Executes 2 queries sequentially and synthesizes results within step budget.",
    groundTruth: "246 Google Ads campaigns (capped subset) + WA active count",
    badgeColor: "bg-stone-100 text-stone-800 border-stone-300"
  },
  {
    id: "F2",
    category: "Category F — Multi-Step & Budget Pressure",
    catId: "F",
    title: "F2. Step-budget exhaustion protection",
    prompt: "Go through every single listing one at a time and tell me the grand total list price across all 1,000 of them.",
    capability: "Early budget exhaustion recognition",
    tools: ["finalize"],
    expected: "Recognizes 1,000 rows cannot be enumerated one-by-one under MAX_STEPS=5 & 50-row cap, and declines up front.",
    groundTruth: "Budget limit protection (MAX_STEPS = 5)",
    badgeColor: "bg-stone-100 text-stone-800 border-stone-300"
  }
]

export function EvaluationSuiteModal({ isOpen, onClose, onSelectPrompt }) {
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { id: "ALL", label: "All Evaluation Questions (19)" },
    { id: "A", label: "Category A — Smoke Tests" },
    { id: "B", label: "Category B — Aggregations" },
    { id: "C", label: "Category C — Error Handling" },
    { id: "D", label: "Category D — Clarifications" },
    { id: "E", label: "Category E — Out of Scope" },
    { id: "F", label: "Category F — Step Budget" },
  ]

  const filteredCases = EVALUATION_CASES.filter(c => {
    const matchesCat = selectedCategory === "ALL" || c.catId === selectedCategory
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.capability.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Evaluation Test Suite Benchmark"
      description="Benchmark evaluation suite grounded in backend seeded database (1,000 listings LST-5001..6000 & 1,000 campaigns CMP-8001..9000)."
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Category Pills & Search Bar */}
        <div className="space-y-3 sticky top-0 bg-[#ffffff] pt-1 pb-2 z-10 border-b border-[#e7e5e4]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777169]" />
            <input
              type="text"
              placeholder="Search evaluation questions, tools, or ground truth..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fafafa] text-[#0c0a09] text-xs pl-8 pr-3 py-2 rounded-xl border border-[#d6d3d1] focus:outline-none focus:border-[#0c0a09]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <Filter className="w-3.5 h-3.5 text-[#777169] flex-shrink-0 mr-1" />
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#292524] text-white shadow-xs"
                    : "bg-[#f0efed] text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Cases List */}
        <div className="space-y-3">
          {filteredCases.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#ffffff] border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold mb-1 ${item.badgeColor}`}>
                    {item.id} • {item.category}
                  </span>
                  <h4 className="font-serif text-sm font-normal text-[#0c0a09]">
                    {item.title}
                  </h4>
                </div>

                <button
                  onClick={() => {
                    onSelectPrompt(item.prompt)
                    onClose()
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#292524] text-white hover:bg-[#0c0a09] text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 shadow-xs"
                >
                  <span>Run Prompt</span>
                  <ArrowRight className="w-3 h-3 text-white/80" />
                </button>
              </div>

              {/* Prompt Quote */}
              <div className="p-2.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] text-xs font-mono text-[#0c0a09]">
                <span className="text-[#777169] text-[10px] block font-sans">PROMPT:</span>
                "{item.prompt}"
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#4e4e4e]">
                <div>
                  <span className="text-[#777169] font-medium block">Expected Tools & Behavior:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {item.tools.map((t, idx) => (
                      <span key={idx} className="font-mono text-[10px] bg-[#f0efed] px-1.5 py-0.5 rounded border border-[#e7e5e4] text-[#0c0a09]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#4e4e4e] mt-1 leading-snug">{item.expected}</p>
                </div>

                <div>
                  <span className="text-[#777169] font-medium block">Ground Truth Value:</span>
                  <div className="mt-0.5 text-[#0c0a09] font-mono font-semibold bg-emerald-50/60 text-emerald-900 p-1.5 rounded-lg border border-emerald-200/60">
                    {item.groundTruth}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
