"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import type { AppId } from "./types"

const ALL_APPS: { id: AppId; name: string; category: string }[] = [
  { id: "finder", name: "Finder", category: "Applications" },
  { id: "safari", name: "Safari", category: "Applications" },
  { id: "notes", name: "Notes", category: "Applications" },
  { id: "calculator", name: "Calculator", category: "Applications" },
  { id: "terminal", name: "Terminal", category: "Applications" },
  { id: "photos", name: "Photos", category: "Applications" },
  { id: "settings", name: "System Settings", category: "System" },
  { id: "music", name: "Music", category: "Applications" },
  { id: "calendar", name: "Calendar", category: "Applications" },
  { id: "mail", name: "Mail", category: "Applications" },
  { id: "weather", name: "Weather", category: "Applications" },
  { id: "clock", name: "Clock", category: "Applications" },
  { id: "maps", name: "Maps", category: "Applications" },
  { id: "messages", name: "Messages", category: "Applications" },
  { id: "appstore", name: "App Store", category: "Applications" },
]

interface SpotlightProps {
  onClose: () => void
  onOpenApp: (id: AppId) => void
}

export function Spotlight({ onClose, onOpenApp }: SpotlightProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = query.trim()
    ? ALL_APPS.filter(
        (app) =>
          app.name.toLowerCase().includes(query.toLowerCase()) ||
          app.category.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_APPS.slice(0, 6)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        onOpenApp(filtered[selectedIndex].id)
      }
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  const APP_ICONS: Record<string, string> = {
    finder: "#1e90ff",
    safari: "#0077b6",
    notes: "#f9c74f",
    calculator: "#444",
    terminal: "#1a1a2e",
    photos: "#ff6b6b",
    settings: "#636e72",
    music: "#fc3c44",
    calendar: "#ff3b30",
    mail: "#007aff",
    weather: "#4fc3f7",
    clock: "#333",
    maps: "#34c759",
    messages: "#34c759",
    appstore: "#0d84ff",
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[18vh]"
      style={{ background: "rgba(0,0,0,0.2)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="w-[540px] overflow-hidden"
        style={{
          background: "rgba(242,242,242,0.88)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Search className="h-5 w-5 text-[#999]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Spotlight Search"
            className="flex-1 bg-transparent text-[18px] font-light text-[#262626] outline-none placeholder:text-[#aaa]"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        {filtered.length > 0 && (
          <div className="max-h-[400px] overflow-auto py-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#999]">
              {query ? "Top Results" : "Suggested"}
            </div>
            {filtered.map((app, index) => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                  selectedIndex === index
                    ? "bg-[#0058d0] text-white"
                    : "text-[#333]"
                }`}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                  style={{ background: APP_ICONS[app.id] || "#666" }}
                >
                  {app.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{app.name}</div>
                  <div className={`text-[11px] ${selectedIndex === index ? "text-white/60" : "text-[#999]"}`}>
                    {app.category}
                  </div>
                </div>
                {selectedIndex === index && (
                  <span className="text-[11px] text-white/60">Return to open</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
