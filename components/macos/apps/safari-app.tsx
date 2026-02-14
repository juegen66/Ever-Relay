"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Share,
  Plus,
  Lock,
} from "lucide-react"

interface Bookmark {
  name: string
  url: string
  color: string
}

const BOOKMARKS: Bookmark[] = [
  { name: "Apple", url: "apple.com", color: "#333" },
  { name: "GitHub", url: "github.com", color: "#24292f" },
  { name: "YouTube", url: "youtube.com", color: "#ff0000" },
  { name: "Twitter", url: "x.com", color: "#1da1f2" },
  { name: "Reddit", url: "reddit.com", color: "#ff4500" },
  { name: "Wikipedia", url: "wikipedia.org", color: "#636466" },
]

const SUGGESTIONS = [
  "How to learn React",
  "Best restaurants nearby",
  "Weather forecast today",
  "macOS keyboard shortcuts",
  "JavaScript tutorials 2025",
  "Latest tech news",
]

export function SafariApp() {
  const [url, setUrl] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState<string | null>(null)

  const handleNavigate = (target: string) => {
    setUrl(target)
    setCurrentPage(target)
    setIsSearching(false)
  }

  const handleSearch = () => {
    if (url.trim()) {
      setCurrentPage(url.trim())
      setIsSearching(false)
    }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "#fff" }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: "rgba(246, 246, 246, 0.95)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-1">
          <button className="rounded-md p-1 text-[#999] hover:bg-black/5" aria-label="Go back">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1 text-[#999] hover:bg-black/5" aria-label="Go forward">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-black/[0.06] px-3 py-1.5">
          <Lock className="h-3 w-3 text-[#999]" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setIsSearching(true)
            }}
            onFocus={() => setIsSearching(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
              if (e.key === "Escape") setIsSearching(false)
            }}
            placeholder="Search or enter website name"
            className="w-full bg-transparent text-center text-[13px] text-[#333] outline-none placeholder:text-[#bbb]"
          />
        </div>

        <div className="flex items-center gap-1">
          <button className="rounded-md p-1 text-[#999] hover:bg-black/5" aria-label="Reload">
            <RotateCw className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1 text-[#999] hover:bg-black/5" aria-label="Share">
            <Share className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1 text-[#999] hover:bg-black/5" aria-label="New tab">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isSearching && url ? (
          /* Search Suggestions */
          <div className="p-4">
            <div className="rounded-lg border border-[#e5e5e5] bg-white shadow-sm">
              {SUGGESTIONS.filter((s) =>
                s.toLowerCase().includes(url.toLowerCase())
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleNavigate(suggestion)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[#333] transition-colors hover:bg-[#f5f5f5]"
                >
                  <RotateCw className="h-3.5 w-3.5 text-[#bbb]" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : currentPage ? (
          /* Browsing a page */
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <Globe className="h-16 w-16 text-[#ccc]" />
            <div className="text-center">
              <h2 className="text-lg font-medium text-[#333]">{currentPage}</h2>
              <p className="mt-1 text-[13px] text-[#999]">
                Web content would be displayed here
              </p>
            </div>
          </div>
        ) : (
          /* Start Page */
          <div className="flex flex-col items-center p-8">
            <h2 className="mb-6 text-[22px] font-medium text-[#333]">
              Favorites
            </h2>
            <div className="grid grid-cols-4 gap-6">
              {BOOKMARKS.map((bookmark) => (
                <button
                  key={bookmark.name}
                  onClick={() => handleNavigate(bookmark.url)}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-black/[0.04]"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                    style={{ background: bookmark.color }}
                  >
                    {bookmark.name.charAt(0)}
                  </div>
                  <span className="text-[12px] text-[#666]">{bookmark.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-[15px] font-medium text-[#333]">
                Privacy Report
              </h3>
              <p className="mt-1 text-[12px] text-[#999]">
                Safari has prevented 12 trackers from profiling you in the last 7 days.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Globe({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
