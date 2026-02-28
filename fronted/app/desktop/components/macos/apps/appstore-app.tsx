"use client"

import { useState } from "react"
import { Download, Star, Search } from "lucide-react"

interface AppItem {
  id: string
  name: string
  developer: string
  category: string
  rating: number
  color: string
  letter: string
  size: string
  price: string
}

const FEATURED_APPS: AppItem[] = [
  { id: "1", name: "Notion", developer: "Notion Labs", category: "Productivity", rating: 4.8, color: "#000", letter: "N", size: "92 MB", price: "Free" },
  { id: "2", name: "Figma", developer: "Figma, Inc.", category: "Design", rating: 4.7, color: "#a259ff", letter: "F", size: "125 MB", price: "Free" },
  { id: "3", name: "Slack", developer: "Slack Technologies", category: "Business", rating: 4.5, color: "#4a154b", letter: "S", size: "156 MB", price: "Free" },
  { id: "4", name: "VS Code", developer: "Microsoft", category: "Developer Tools", rating: 4.9, color: "#007acc", letter: "VS", size: "200 MB", price: "Free" },
  { id: "5", name: "Spotify", developer: "Spotify AB", category: "Music", rating: 4.6, color: "#1db954", letter: "S", size: "110 MB", price: "Free" },
  { id: "6", name: "Raycast", developer: "Raycast", category: "Productivity", rating: 4.9, color: "#ff6363", letter: "R", size: "48 MB", price: "Free" },
  { id: "7", name: "Arc Browser", developer: "The Browser Company", category: "Utilities", rating: 4.7, color: "#6b5ce7", letter: "A", size: "180 MB", price: "Free" },
  { id: "8", name: "Bear", developer: "Shiny Frog", category: "Productivity", rating: 4.6, color: "#d4563f", letter: "B", size: "35 MB", price: "$14.99/yr" },
]

const TABS = ["Discover", "Arcade", "Create", "Work", "Play", "Develop"]

export function AppStoreApp() {
  const [activeTab, setActiveTab] = useState("Discover")
  const [searchQuery, setSearchQuery] = useState("")
  const [installed, setInstalled] = useState<Set<string>>(new Set())

  const toggleInstall = (id: string) => {
    setInstalled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = searchQuery
    ? FEATURED_APPS.filter(
        (app) =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FEATURED_APPS

  return (
    <div className="flex h-full flex-col" style={{ background: "#fafafa" }}>
      {/* Tabs & Search */}
      <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#007aff] text-white"
                  : "text-[#666] hover:bg-black/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2.5 py-1">
          <Search className="h-3 w-3 text-[#999]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-32 bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#bbb]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {/* Featured Banner */}
        {!searchQuery && (
          <div
            className="mb-6 rounded-2xl p-6 text-white"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            <div className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Featured</div>
            <h2 className="mt-1 text-[28px] font-bold">Best New Apps</h2>
            <p className="mt-1 text-[14px] text-white/70">Discover the top apps that are redefining productivity and creativity.</p>
          </div>
        )}

        {/* App Grid */}
        <h3 className="mb-3 text-[17px] font-semibold text-[#333]">
          {searchQuery ? `Results for "${searchQuery}"` : "Top Free Apps"}
        </h3>
        <div className="space-y-1">
          {filtered.map((app, index) => (
            <div
              key={app.id}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-black/[0.02]"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
            >
              <span className="w-5 text-[14px] font-medium text-[#999]">{index + 1}</span>
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-[16px] font-bold text-white shadow-sm"
                style={{ background: app.color }}
              >
                {app.letter}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-[#333]">{app.name}</div>
                <div className="text-[12px] text-[#999]">{app.category}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${i < Math.floor(app.rating) ? "fill-[#ff9500] text-[#ff9500]" : "text-[#ddd]"}`}
                    />
                  ))}
                  <span className="text-[10px] text-[#999] ml-1">{app.rating}</span>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => toggleInstall(app.id)}
                  className={`rounded-full px-3.5 py-1 text-[12px] font-medium transition-colors ${
                    installed.has(app.id)
                      ? "bg-[#e5e5ea] text-[#666]"
                      : "bg-[#007aff] text-white hover:bg-[#0066dd]"
                  }`}
                >
                  {installed.has(app.id) ? "Open" : (
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {app.price}
                    </span>
                  )}
                </button>
                <div className="text-[10px] text-[#bbb] mt-0.5">{app.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
