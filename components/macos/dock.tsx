"use client"

import { useState, useRef, useCallback } from "react"
import type { AppId, WindowState } from "./types"

interface DockItem {
  id: AppId
  name: string
  iconLetter: string
  color: string
}

const DOCK_ITEMS: DockItem[] = [
  { id: "finder", name: "Finder", iconLetter: "F", color: "linear-gradient(135deg, #1e90ff 0%, #0055d4 100%)" },
  { id: "safari", name: "Safari", iconLetter: "S", color: "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)" },
  { id: "mail", name: "Mail", iconLetter: "M", color: "linear-gradient(135deg, #4da3ff 0%, #007aff 100%)" },
  { id: "messages", name: "Messages", iconLetter: "M", color: "linear-gradient(135deg, #5ff05f 0%, #34c759 100%)" },
  { id: "maps", name: "Maps", iconLetter: "M", color: "linear-gradient(135deg, #4cd964 0%, #30b050 100%)" },
  { id: "photos", name: "Photos", iconLetter: "P", color: "linear-gradient(135deg, #ff6b6b 0%, #ee3a3a 100%)" },
  { id: "music", name: "Music", iconLetter: "M", color: "linear-gradient(135deg, #fc3c44 0%, #d42030 100%)" },
  { id: "notes", name: "Notes", iconLetter: "N", color: "linear-gradient(135deg, #fddb4a 0%, #e8b800 100%)" },
  { id: "calendar", name: "Calendar", iconLetter: "", color: "#fff" },
  { id: "weather", name: "Weather", iconLetter: "W", color: "linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%)" },
  { id: "clock", name: "Clock", iconLetter: "C", color: "linear-gradient(135deg, #555 0%, #222 100%)" },
  { id: "calculator", name: "Calculator", iconLetter: "C", color: "linear-gradient(135deg, #555 0%, #333 100%)" },
  { id: "terminal", name: "Terminal", iconLetter: ">_", color: "linear-gradient(135deg, #1a1a2e 0%, #000 100%)" },
  { id: "appstore", name: "App Store", iconLetter: "A", color: "linear-gradient(135deg, #0d84ff 0%, #0055cc 100%)" },
  { id: "settings", name: "System Settings", iconLetter: "S", color: "linear-gradient(135deg, #8e8e93 0%, #636366 100%)" },
]

interface DockProps {
  openApp: (id: AppId) => void
  openWindows: WindowState[]
  activeWindowId: string | null
  bouncingApp?: AppId | null
}

export function Dock({ openApp, openWindows, activeWindowId, bouncingApp }: DockProps) {
  const dockRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ name: string; x: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dockRef.current) return
    const rect = dockRef.current.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
    setMouseX(null)
    setTooltip(null)
  }, [])

  const getScale = useCallback((index: number) => {
    if (mouseX === null || !dockRef.current) return 1
    const itemWidth = 52
    const padding = 10
    const separatorsBefore = index > 13 ? 1 : 0
    const itemCenter = index * (itemWidth + 4) + itemWidth / 2 + padding + separatorsBefore * 12
    const distance = Math.abs(mouseX - itemCenter)
    const maxDist = 100
    if (distance > maxDist) return 1
    return 1 + 0.6 * Math.cos((distance / maxDist) * (Math.PI / 2))
  }, [mouseX])

  const today = new Date()
  const dayOfMonth = today.getDate()
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()

  return (
    <div className="fixed bottom-1.5 left-1/2 z-[9998] -translate-x-1/2">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute -top-10 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium text-white -translate-x-1/2"
          style={{
            left: tooltip.x,
            background: "rgba(30, 30, 30, 0.8)",
            backdropFilter: "blur(10px)",
          }}
        >
          {tooltip.name}
        </div>
      )}

      <div
        ref={dockRef}
        className="flex items-end gap-1 rounded-2xl px-2.5 pb-1.5 pt-1.5"
        style={{
          background: "rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(50px) saturate(170%)",
          WebkitBackdropFilter: "blur(50px) saturate(170%)",
          border: "0.5px solid rgba(255, 255, 255, 0.35)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {DOCK_ITEMS.map((item, index) => {
          const scale = getScale(index)
          const isOpen = openWindows.some((w) => w.appId === item.id)

          // Separator before settings (last item)
          const showSeparator = index === DOCK_ITEMS.length - 1

          return (
            <div key={item.id} className="flex items-end">
              {showSeparator && (
                <div className="mx-1 mb-1 h-10 w-px bg-white/20" />
              )}
              <div
                className="relative flex flex-col items-center"
                onMouseEnter={(e) => {
                  setHoveredIndex(index)
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const dockRect = dockRef.current?.getBoundingClientRect()
                  if (dockRect) {
                    setTooltip({ name: item.name, x: rect.left - dockRect.left + rect.width / 2 })
                  }
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null)
                  setTooltip(null)
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openApp(item.id)
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-[11px] shadow-lg active:brightness-90 ${bouncingApp === item.id ? "dock-bounce" : ""}`}
                  style={{
                    background: item.id === "calendar" ? "#fff" : item.color,
                    transform: `scale(${scale}) translateY(${(scale - 1) * -16}px)`,
                    transformOrigin: "bottom",
                    transition: mouseX !== null ? "none" : "transform 0.2s ease-out",
                    border: item.id === "calendar" ? "0.5px solid rgba(0,0,0,0.1)" : undefined,
                  }}
                  aria-label={`Open ${item.name}`}
                >
                  {item.id === "calendar" ? (
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[9px] font-bold text-[#ff3b30]">{dayOfWeek}</span>
                      <span className="text-[22px] font-light text-[#333] -mt-0.5">{dayOfMonth}</span>
                    </div>
                  ) : item.id === "terminal" ? (
                    <span className="font-mono text-[14px] font-bold text-white">{">_"}</span>
                  ) : item.id === "settings" ? (
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  ) : (
                    <span className="text-[18px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                      {item.iconLetter}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div
                    className="mt-0.5 h-[3px] w-[3px] rounded-full bg-white/80"
                    style={{
                      transform: `translateY(${(scale - 1) * -16}px)`,
                      transition: mouseX !== null ? "none" : "transform 0.2s ease-out",
                    }}
                  />
                )}
                {!isOpen && <div className="mt-0.5 h-[3px] w-[3px]" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
