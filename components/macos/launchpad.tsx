"use client"

import type { AppId } from "./types"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"

const LAUNCHPAD_APPS: { id: AppId; name: string; color: string; letter: string }[] = [
  { id: "finder", name: "Finder", color: "linear-gradient(135deg, #1e90ff 0%, #0055d4 100%)", letter: "F" },
  { id: "safari", name: "Safari", color: "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)", letter: "S" },
  { id: "mail", name: "Mail", color: "linear-gradient(135deg, #4da3ff 0%, #007aff 100%)", letter: "M" },
  { id: "messages", name: "Messages", color: "linear-gradient(135deg, #5ff05f 0%, #34c759 100%)", letter: "M" },
  { id: "maps", name: "Maps", color: "linear-gradient(135deg, #4cd964 0%, #30b050 100%)", letter: "M" },
  { id: "photos", name: "Photos", color: "linear-gradient(135deg, #ff6b6b 0%, #ee3a3a 100%)", letter: "P" },
  { id: "music", name: "Music", color: "linear-gradient(135deg, #fc3c44 0%, #d42030 100%)", letter: "M" },
  { id: "notes", name: "Notes", color: "linear-gradient(135deg, #fddb4a 0%, #e8b800 100%)", letter: "N" },
  { id: "calendar", name: "Calendar", color: "linear-gradient(135deg, #ff3b30 0%, #cc2d26 100%)", letter: "C" },
  { id: "weather", name: "Weather", color: "linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%)", letter: "W" },
  { id: "clock", name: "Clock", color: "linear-gradient(135deg, #555 0%, #222 100%)", letter: "C" },
  { id: "calculator", name: "Calculator", color: "linear-gradient(135deg, #555 0%, #333 100%)", letter: "C" },
  { id: "terminal", name: "Terminal", color: "linear-gradient(135deg, #1a1a2e 0%, #000 100%)", letter: ">_" },
  { id: "appstore", name: "App Store", color: "linear-gradient(135deg, #0d84ff 0%, #0055cc 100%)", letter: "A" },
  { id: "settings", name: "Settings", color: "linear-gradient(135deg, #8e8e93 0%, #636366 100%)", letter: "S" },
]

export function Launchpad() {
  const onOpenApp = useDesktopWindowStore((state) => state.openApp)
  const onClose = useDesktopUIStore((state) => state.closeLaunchpad)

  return (
    <div
      className="fixed inset-0 z-[10004] flex flex-col items-center justify-center animate-launchpad"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(40px) saturate(150%)",
        WebkitBackdropFilter: "blur(40px) saturate(150%)",
      }}
      onClick={onClose}
    >
      {/* Search */}
      <div className="mb-8">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 w-60"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <svg className="h-3.5 w-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-[13px] text-white/40">Search</span>
        </div>
      </div>

      {/* App Grid */}
      <div
        className="grid grid-cols-5 gap-x-12 gap-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {LAUNCHPAD_APPS.map((app) => (
          <button
            key={app.id}
            className="flex flex-col items-center gap-2 group"
            onClick={() => {
              onOpenApp(app.id)
              onClose()
            }}
          >
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] shadow-lg transition-transform group-hover:scale-110 group-active:scale-95"
              style={{ background: app.color }}
            >
              {app.id === "terminal" ? (
                <span className="font-mono text-[18px] font-bold text-white">{">_"}</span>
              ) : app.id === "settings" ? (
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              ) : (
                <span className="text-[24px] font-bold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                  {app.letter}
                </span>
              )}
            </div>
            <span className="text-[12px] text-white font-medium" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {app.name}
            </span>
          </button>
        ))}
      </div>

      {/* Page dots */}
      <div className="mt-10 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white" />
        <div className="h-2 w-2 rounded-full bg-white/30" />
      </div>
    </div>
  )
}
