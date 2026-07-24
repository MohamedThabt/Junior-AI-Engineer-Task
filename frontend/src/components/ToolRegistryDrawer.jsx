import React from "react"
import { Modal } from "./ui/Modal"
import { Wrench, Database, ShieldAlert, CheckCircle, Terminal, Layers } from "lucide-react"

const TOOLS_INVENTORY = [
  {
    name: "query_listings",
    verb: "read",
    table: "real_estate_listings",
    repository: "ListingRepository.query()",
    description: "Query real estate listings by filters (city, state, listing_status, bedrooms, bathrooms, price range). Server capped limit.",
    rules: "Read-only. Returns standard JSON envelope capped at max 20-50 rows.",
  },
  {
    name: "insert_listing",
    verb: "create",
    table: "real_estate_listings",
    repository: "ListingRepository.insert()",
    description: "Insert a new real estate listing record with property attributes.",
    rules: "Validates all fields (property_type, city, list_price > 0, etc.) before SQL execution.",
  },
  {
    name: "update_listing",
    verb: "modify",
    table: "real_estate_listings",
    repository: "ListingRepository.update()",
    description: "Update fields of an existing real estate listing record by exact listing_id.",
    rules: "Requires exact primary key (e.g. LST-5001). Never updates broad filters.",
  },
  {
    name: "delete_listing",
    verb: "delete",
    table: "real_estate_listings",
    repository: "ListingRepository.delete()",
    description: "Delete a real estate listing by exact listing_id.",
    rules: "Requires exact listing_id. Irreversible action.",
  },
  {
    name: "query_campaigns",
    verb: "read",
    table: "marketing_campaigns",
    repository: "CampaignRepository.query()",
    description: "Query marketing campaigns by channel, date range, or campaign_name.",
    rules: "Read-only. Returns performance metrics (impressions, clicks, conversions, revenue).",
  },
  {
    name: "insert_campaign",
    verb: "create",
    table: "marketing_campaigns",
    repository: "CampaignRepository.insert()",
    description: "Create a new marketing campaign entry with budget and channel allocations.",
    rules: "Validates ISO dates and budget_allocated >= 0.",
  },
  {
    name: "update_campaign",
    verb: "modify",
    table: "marketing_campaigns",
    repository: "CampaignRepository.update()",
    description: "Update marketing campaign record by exact campaign_id.",
    rules: "Targets exact campaign_id (e.g. CMP-8001).",
  },
  {
    name: "delete_campaign",
    verb: "delete",
    table: "marketing_campaigns",
    repository: "CampaignRepository.delete()",
    description: "Delete marketing campaign record by exact campaign_id.",
    rules: "Requires exact campaign_id.",
  },
  {
    name: "finalize",
    verb: "control",
    table: "None (Agent Loop Control)",
    repository: "Agent Finalize Node",
    description: "Control tool called by LLM when enough information is available to provide final natural-language response.",
    rules: "Does not touch DB. Terminates current per-request agent loop.",
  },
]

export function ToolRegistryDrawer({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Tool Registry & Inventory"
      description="System tool specifications defined in Section 6 of agent-architecture.md."
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {/* Rules Reminder Banner */}
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Agent Tool Operational Contracts:
          </div>
          <p className="text-[11px] leading-relaxed">
            • Single responsibility per tool (1 verb on 1 table).<br />
            • Deterministic execution with standard JSON result envelope.<br />
            • Internal retry up to 2 times on transient DB exceptions.<br />
            • Write operations strictly require exact primary keys (`listing_id` / `campaign_id`).
          </p>
        </div>

        {/* Tools List */}
        <div className="space-y-3">
          {TOOLS_INVENTORY.map((tool) => {
            const verbColor =
              tool.verb === "read"
                ? "bg-blue-950 text-blue-400 border-blue-800/50"
                : tool.verb === "create"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800/50"
                : tool.verb === "modify"
                ? "bg-amber-950 text-amber-400 border-amber-800/50"
                : tool.verb === "delete"
                ? "bg-rose-950 text-rose-400 border-rose-800/50"
                : "bg-purple-950 text-purple-400 border-purple-800/50"

            return (
              <div
                key={tool.name}
                className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-bold text-zinc-100">{tool.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${verbColor}`}>
                    {tool.verb}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {tool.description}
                </p>

                <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                  <div>
                    <span className="text-zinc-500">Target Table:</span>{" "}
                    <code className="text-zinc-200">{tool.table}</code>
                  </div>
                  <div>
                    <span className="text-zinc-500">Repository Call:</span>{" "}
                    <code className="text-cyan-300">{tool.repository}</code>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 italic">
                  Rule: {tool.rules}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
