import React, { useState } from "react"
import { Modal } from "./ui/Modal"
import { Building2, Megaphone, Table, Search, DollarSign } from "lucide-react"

const MOCK_LISTINGS = [
  { listing_id: "LST-5001", property_type: "House", city: "Cairo", state: "Cairo", bedrooms: 4, bathrooms: 3.5, square_footage: 3200, year_built: 2021, list_price: 450000, sale_price: null, listing_status: "Active" },
  { listing_id: "LST-5002", property_type: "Condo", city: "Cairo", state: "Cairo", bedrooms: 2, bathrooms: 2.0, square_footage: 1450, year_built: 2022, list_price: 220000, sale_price: 215000, listing_status: "Sold" },
  { listing_id: "LST-5003", property_type: "Villa", city: "Giza", state: "Giza", bedrooms: 6, bathrooms: 5.5, square_footage: 5800, year_built: 2020, list_price: 890000, sale_price: null, listing_status: "Active" },
  { listing_id: "LST-5004", property_type: "Apartment", city: "Alexandria", state: "Alexandria", bedrooms: 3, bathrooms: 2.0, square_footage: 1850, year_built: 2019, list_price: 195000, sale_price: null, listing_status: "Pending" },
]

const MOCK_CAMPAIGNS = [
  { campaign_id: "CMP-8001", campaign_name: "Summer Real Estate Launch", channel: "Facebook", start_date: "2026-05-01", end_date: "2026-06-30", budget_allocated: 15000, amount_spent: 12400, impressions: 85000, clicks: 3400, conversions: 210, revenue_generated: 48000 },
  { campaign_id: "CMP-8002", campaign_name: "Luxury Villas Google Search", channel: "Google Search", start_date: "2026-06-01", end_date: "2026-07-15", budget_allocated: 25000, amount_spent: 24800, impressions: 140000, clicks: 8200, conversions: 450, revenue_generated: 120000 },
  { campaign_id: "CMP-8003", campaign_name: "Instagram Condo Showcase", channel: "Instagram", start_date: "2026-07-01", end_date: "2026-07-31", budget_allocated: 8000, amount_spent: 4200, impressions: 45000, clicks: 1900, conversions: 85, revenue_generated: 18500 },
]

export function DomainDataDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("listings")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredListings = MOCK_LISTINGS.filter(item => 
    item.listing_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.property_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(item =>
    item.campaign_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channel.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Domain Database Explorer"
      description="Inspect real estate listings & marketing campaign tables referenced in the system prompt."
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === "listings"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              real_estate_listings
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === "campaigns"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-purple-400" />
              marketing_campaigns
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table..."
              className="w-36 sm:w-48 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 pl-8 text-[11px] text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Data Table Container */}
        <div className="max-h-[55vh] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950">
          {activeTab === "listings" ? (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 sticky top-0 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">City</th>
                  <th className="p-2.5">Beds/Baths</th>
                  <th className="p-2.5">SqFt</th>
                  <th className="p-2.5">Price (USD)</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-[11px] text-zinc-300">
                {filteredListings.map((item) => (
                  <tr key={item.listing_id} className="hover:bg-zinc-900/40">
                    <td className="p-2.5 font-bold text-cyan-400">{item.listing_id}</td>
                    <td className="p-2.5">{item.property_type}</td>
                    <td className="p-2.5">{item.city}</td>
                    <td className="p-2.5">{item.bedrooms}b / {item.bathrooms}ba</td>
                    <td className="p-2.5">{item.square_footage.toLocaleString()}</td>
                    <td className="p-2.5 font-semibold text-emerald-400">${item.list_price.toLocaleString()}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        item.listing_status === "Active" ? "bg-emerald-950 text-emerald-400" :
                        item.listing_status === "Pending" ? "bg-amber-950 text-amber-400" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {item.listing_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 sticky top-0 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Channel</th>
                  <th className="p-2.5">Budget</th>
                  <th className="p-2.5">Spent</th>
                  <th className="p-2.5">Conversions</th>
                  <th className="p-2.5">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-[11px] text-zinc-300">
                {filteredCampaigns.map((item) => (
                  <tr key={item.campaign_id} className="hover:bg-zinc-900/40">
                    <td className="p-2.5 font-bold text-purple-400">{item.campaign_id}</td>
                    <td className="p-2.5 font-sans font-medium text-zinc-200">{item.campaign_name}</td>
                    <td className="p-2.5 text-zinc-400">{item.channel}</td>
                    <td className="p-2.5">${item.budget_allocated.toLocaleString()}</td>
                    <td className="p-2.5 text-amber-400">${item.amount_spent.toLocaleString()}</td>
                    <td className="p-2.5 font-semibold">{item.conversions}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">${item.revenue_generated.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  )
}
