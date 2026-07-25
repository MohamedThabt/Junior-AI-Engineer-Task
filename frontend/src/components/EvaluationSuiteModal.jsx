import React, { useState } from "react"
import { Modal } from "./ui/Modal"
import {
  Filter,
  Search,
  PenLine,
  Eye,
  PlusCircle,
  PencilLine,
  Trash2,
  Ban,
  AlertTriangle
} from "lucide-react"

// Operation-type metadata — every case is tagged with the CRUD-ish
// operation it exercises so the suite visibly maps back to the task's
// required capabilities: Read, Query, Insert, Modify, Delete.
const OP_META = {
  read: { label: "Read / Query", icon: Eye, className: "bg-sky-50 text-sky-700 border-sky-200" },
  insert: { label: "Insert", icon: PlusCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  modify: { label: "Modify", icon: PencilLine, className: "bg-amber-50 text-amber-800 border-amber-200" },
  delete: { label: "Delete", icon: Trash2, className: "bg-rose-50 text-rose-700 border-rose-200" },
  none: { label: "Out of Scope", icon: Ban, className: "bg-purple-50 text-purple-700 border-purple-200" },
}

export const EVALUATION_CASES = [
  {
    id: "A1",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "read",
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
    op: "read",
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
    op: "read",
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
    op: "read",
    title: "A4. Empty result honesty",
    prompt: "Show me any listings in Hawaii.",
    capability: "Honest empty result handling (Rule 5)",
    tools: ["query_real_estate", "finalize"],
    expected: "query_real_estate returns 0 rows; agent states plainly none exist. Must NOT hallucinate rows.",
    groundTruth: "0 listings in Hawaii",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A5",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "insert",
    destructive: true,
    title: "A5. Insert — new real-estate listing",
    prompt: "Add a new listing: LST-7001, a single-family house in Denver, Colorado, 4 bedrooms, 3 bathrooms, 2,400 sqft, built in 2015, listed at $525,000, status Active.",
    capability: "FR-04: create a new record with all required columns",
    tools: ["insert_real_estate", "finalize"],
    expected: "insert_real_estate with listing_id='LST-7001' (outside the seeded LST-5001..6000 range, guaranteed new). Agent confirms creation.",
    groundTruth: "LST-7001 does not exist in seed → insert succeeds",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A6",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "insert",
    destructive: true,
    title: "A6. Insert — new marketing campaign",
    prompt: "Create a new campaign CMP-9500 named 'Fall Referral Push' on the Email channel, running 2024-09-01 to 2024-09-30, with a $10,000 budget, $0 spent so far, 0 impressions, 0 clicks, 0 conversions, and $0 revenue.",
    capability: "FR-04: create a new record with all required columns",
    tools: ["insert_campaign", "finalize"],
    expected: "insert_campaign with campaign_id='CMP-9500' (outside the seeded CMP-8001..9000 range). Agent confirms creation.",
    groundTruth: "CMP-9500 does not exist in seed → insert succeeds",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A7",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "modify",
    destructive: true,
    title: "A7. Modify — update an existing listing",
    prompt: "Update listing LST-5001 — change its list price to $610,000.",
    capability: "FR-05: update an existing record by exact PK",
    tools: ["update_real_estate", "finalize"],
    expected: "update_real_estate with listing_id='LST-5001', list_price=610000. Tool returns success=True; agent confirms the new price.",
    groundTruth: "LST-5001 exists → update succeeds",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A8",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "modify",
    destructive: true,
    title: "A8. Modify — update an existing campaign",
    prompt: "Update campaign CMP-8001 — set its amount spent to $15,000.",
    capability: "FR-05: update an existing record by exact PK",
    tools: ["update_campaign", "finalize"],
    expected: "update_campaign with campaign_id='CMP-8001', amount_spent=15000. Tool returns success=True; agent confirms the change.",
    groundTruth: "CMP-8001 exists → update succeeds",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "A9",
    category: "Category A — Smoke Tests",
    catId: "A",
    op: "delete",
    destructive: true,
    title: "A9. Delete — remove an existing listing (happy path)",
    prompt: "Delete listing LST-6000.",
    capability: "FR-06: delete an existing record by exact PK",
    tools: ["delete_real_estate", "finalize"],
    expected: "delete_real_estate with listing_id='LST-6000' (exact PK, exists once — the last seeded listing). Agent confirms removal.",
    groundTruth: "LST-6000 exists once → delete succeeds (real-estate counterpart to D4)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "B1",
    category: "Category B — Post-tool Aggregation",
    catId: "B",
    op: "read",
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
    op: "read",
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
    op: "read",
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
    op: "read",
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
    op: "read",
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
    op: "delete",
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
    op: "delete",
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
    op: "modify",
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
    op: "delete",
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
    op: "delete",
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
    op: "delete",
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
    op: "delete",
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
    op: "delete",
    destructive: true,
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
    op: "none",
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
    op: "none",
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
    op: "none",
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
    op: "none",
    title: "E7. Schema & capability probe",
    prompt: "What can you help me with?",
    capability: "Rule 1: Answering capability questions without wasting tool loop iterations",
    tools: ["finalize"],
    expected: "Summarizes the 2 datasets and 8 data tools without burning a query tool loop iteration.",
    groundTruth: "System prompt capability self-knowledge",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "F1",
    category: "Category F — Multi-Loop-Iteration & Budget Pressure",
    catId: "F",
    op: "read",
    title: "F1. Two-table request within 5-loop-iteration budget",
    prompt: "How many Google Ads campaigns are there, and how many active listings are in Washington?",
    capability: "Multi-tool dispatch within MAX_LOOP_ITERATIONS=5",
    tools: ["query_campaigns", "query_real_estate", "finalize"],
    expected: "Executes 2 queries sequentially and synthesizes results within loop iteration budget.",
    groundTruth: "246 Google Ads campaigns (capped subset) + WA active count",
    badgeColor: "bg-stone-100 text-stone-800 border-stone-300"
  },
  {
    id: "F2",
    category: "Category F — Multi-Loop-Iteration & Budget Pressure",
    catId: "F",
    op: "none",
    title: "F2. Loop-iteration-budget exhaustion protection",
    prompt: "Go through every single listing one at a time and tell me the grand total list price across all 1,000 of them.",
    capability: "Early budget exhaustion recognition",
    tools: ["finalize"],
    expected: "Recognizes 1,000 rows cannot be enumerated one-by-one under MAX_LOOP_ITERATIONS=5 & 50-row cap, and declines up front.",
    groundTruth: "Budget limit protection (MAX_LOOP_ITERATIONS = 5)",
    badgeColor: "bg-stone-100 text-stone-800 border-stone-300"
  }
]

const CATEGORY_DEFS = [
  { id: "ALL", label: "All Tests" },
  { id: "A", label: "Smoke Tests" },
  { id: "B", label: "Aggregations" },
  { id: "C", label: "Error Handling" },
  { id: "D", label: "Clarifications" },
  { id: "E", label: "Out of Scope" },
  { id: "F", label: "Loop Budget" },
]

export function EvaluationSuiteModal({ isOpen, onClose, onSelectPrompt }) {
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = CATEGORY_DEFS.map(cat => ({
    ...cat,
    count: cat.id === "ALL" ? EVALUATION_CASES.length : EVALUATION_CASES.filter(c => c.catId === cat.id).length
  }))

  const filteredCases = EVALUATION_CASES.filter(c => {
    const matchesCat = selectedCategory === "ALL" || c.catId === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
                          c.title.toLowerCase().includes(q) ||
                          c.prompt.toLowerCase().includes(q) ||
                          c.capability.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  const handleUsePrompt = (prompt) => {
    onSelectPrompt(prompt)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Evaluation Test Suite Benchmark"
      description={`${EVALUATION_CASES.length} hand-authored cases covering Read, Query, Insert, Modify & Delete — grounded in the seeded DB (1,000 listings LST-5001..6000 & 1,000 campaigns CMP-8001..9000).`}
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
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-[#292524] text-white shadow-xs"
                    : "bg-[#f0efed] text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]"
                }`}
              >
                <span>{cat.id === "ALL" ? cat.label : `${cat.id} — ${cat.label}`}</span>
                <span className={`px-1.5 rounded-full text-[10px] font-mono ${
                  selectedCategory === cat.id ? "bg-white/15 text-white" : "bg-white text-[#777169] border border-[#e7e5e4]"
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hint banner: explains new fill-only behavior */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
          <PenLine className="w-3.5 h-3.5 flex-shrink-0 text-sky-600" />
          <span>
            <strong className="font-semibold">Use Prompt</strong> only fills the chat composer — it never sends automatically. Review or edit the prompt, then press Send yourself.
          </span>
        </div>

        {/* Test Cases List */}
        <div className="space-y-3">
          {filteredCases.length === 0 && (
            <div className="py-10 text-center text-xs text-[#777169]">
              No evaluation cases match "<span className="font-mono text-[#0c0a09]">{searchQuery}</span>".
            </div>
          )}

          {filteredCases.map((item) => {
            const opMeta = OP_META[item.op] || OP_META.none
            const OpIcon = opMeta.icon
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#ffffff] border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${item.badgeColor}`}>
                        {item.id} • {item.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${opMeta.className}`}>
                        <OpIcon className="w-2.5 h-2.5" />
                        {opMeta.label}
                      </span>
                      {item.destructive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-orange-50 text-orange-800 border-orange-200" title="This test mutates the seeded database — re-seed afterward if needed.">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Mutates DB
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleUsePrompt(item.prompt)}
                    className="px-3 py-1.5 rounded-full bg-[#292524] text-white hover:bg-[#0c0a09] text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                    title="Fill the chat input with this prompt — does not send it"
                  >
                    <PenLine className="w-3 h-3 text-white/80" />
                    <span>Use Prompt</span>
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
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
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
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
