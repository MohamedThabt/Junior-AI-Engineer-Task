import React from "react"
import { Modal } from "./ui/Modal"
import { 
  Wrench, 
  Database, 
  ShieldCheck, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  Sparkles
} from "lucide-react"

export const AGENT_TOOLS = [
  {
    name: "query_real_estate",
    category: "Real Estate Read",
    purpose: "Read real estate property listings filtered by criteria",
    constraints: "Filters: city, state, listing_status, price/beds/baths ranges. Returns ≤ 50 rows cap.",
    params: ["city", "state", "listing_status", "min_price", "max_price", "bedrooms", "bathrooms"]
  },
  {
    name: "insert_real_estate",
    category: "Real Estate Write",
    purpose: "Create a new real estate property listing",
    constraints: "Requires new PK listing_id (pattern: LST-\\d+); fails if ID already exists.",
    params: ["listing_id", "property_type", "city", "state", "bedrooms", "bathrooms", "square_footage", "list_price", "listing_status"]
  },
  {
    name: "update_real_estate",
    category: "Real Estate Write",
    purpose: "Edit attributes of an existing listing",
    constraints: "Targets one exact PK listing_id; never accepts broad filter.",
    params: ["listing_id", "list_price", "listing_status", "sale_price", "..."]
  },
  {
    name: "delete_real_estate",
    category: "Real Estate Write",
    purpose: "Remove a listing from system",
    constraints: "Targets one exact PK listing_id; never accepts filter or bulk delete.",
    params: ["listing_id"]
  },
  {
    name: "query_campaigns",
    category: "Marketing Read",
    purpose: "Read marketing campaigns filtered by channel/name/date",
    constraints: "Filters: channel, campaign_name, start_date, end_date. Returns ≤ 50 rows cap.",
    params: ["channel", "campaign_name", "start_date", "end_date"]
  },
  {
    name: "insert_campaign",
    category: "Marketing Write",
    purpose: "Create a new marketing campaign",
    constraints: "Requires new PK campaign_id (pattern: CMP-\\d+).",
    params: ["campaign_id", "campaign_name", "channel", "budget_allocated", "amount_spent", "impressions", "clicks", "conversions", "revenue_generated"]
  },
  {
    name: "update_campaign",
    category: "Marketing Write",
    purpose: "Edit attributes of an existing marketing campaign",
    constraints: "Targets one exact PK campaign_id.",
    params: ["campaign_id", "budget_allocated", "amount_spent", "revenue_generated", "..."]
  },
  {
    name: "delete_campaign",
    category: "Marketing Write",
    purpose: "Delete a marketing campaign",
    constraints: "Targets one exact PK campaign_id.",
    params: ["campaign_id"]
  },
  {
    name: "finalize",
    category: "Control",
    purpose: "Return the final structured answer to user",
    constraints: "The only way the agent loop completes normally. Required within MAX_STEPS = 5.",
    params: ["answer"]
  }
]

export function ToolRegistryModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registered Agent Tools & System Specs"
      description="The agent exposes exactly 8 data tools + 1 control tool (app/tools/registry.py). It has no other data sources."
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Core Constraints Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0c0a09]">
              <Terminal className="w-3.5 h-3.5 text-[#292524]" />
              <span>MAX_STEPS = 5</span>
            </div>
            <p className="text-[11px] text-[#4e4e4e] leading-snug">
              Hard loop step budget before forced finalization summary.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0c0a09]">
              <Database className="w-3.5 h-3.5 text-[#292524]" />
              <span>50-Row Query Cap</span>
            </div>
            <p className="text-[11px] text-[#4e4e4e] leading-snug">
              Query tools return ≤ 50 rows. Post-query Math (SUM/AVG) notes subset.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0c0a09]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rule 3 & 5 Compliance</span>
            </div>
            <p className="text-[11px] text-[#4e4e4e] leading-snug">
              PK-only updates/deletes with clarification + no hallucinations.
            </p>
          </div>
        </div>

        {/* Tools List */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-semibold text-[#777169] uppercase tracking-wider">
            Tool Definitions (8 Data + 1 Control)
          </h4>

          {AGENT_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="p-4 rounded-xl bg-[#ffffff] border border-[#e7e5e4] space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-xs text-[#0c0a09] bg-[#f0efed] px-2 py-0.5 rounded border border-[#e7e5e4]">
                  {tool.name}
                </span>
                <span className="text-[10px] text-[#777169] bg-[#fafafa] px-2.5 py-0.5 rounded-full border border-[#e7e5e4]">
                  {tool.category}
                </span>
              </div>

              <p className="text-xs text-[#0c0a09] leading-relaxed">
                {tool.purpose}
              </p>

              <div className="p-2.5 rounded-lg bg-[#fafafa] border border-[#e7e5e4] text-[11px] text-[#4e4e4e] leading-relaxed">
                <strong className="text-[#0c0a09] font-medium block mb-0.5">Hard Constraints:</strong>
                {tool.constraints}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
