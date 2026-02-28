"use client"

import { useState, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { AppId } from "./types"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

interface DockItemBase {
  name: string
  iconLetter: string
  color: string
  separatorBefore?: boolean
}

interface DockAppItem extends DockItemBase {
  kind: "app"
  id: AppId
}

interface DockRouteItem extends DockItemBase {
  kind: "route"
  id: "copilot-chat" | "workflow-dashboard"
  href: "/desktop/chat" | "/desktop/workflow"
}

type DockItem = DockAppItem | DockRouteItem

const DOCK_ITEMS: DockItem[] = [
  { kind: "app", id: "finder", name: "Finder", iconLetter: "F", color: "linear-gradient(135deg, #1e90ff 0%, #0055d4 100%)" },
  { kind: "app", id: "canvas", name: "Canvas", iconLetter: "C", color: "linear-gradient(135deg, #ff9f1c 0%, #ff6a00 100%)" },
  { kind: "app", id: "vibecoding", name: "vibecoding", iconLetter: "V", color: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)" },
  { kind: "route", id: "copilot-chat", href: "/desktop/chat", name: "Copilot", iconLetter: "AI", color: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)" },
  { kind: "route", id: "workflow-dashboard", href: "/desktop/workflow", name: "Workflow", iconLetter: "WF", color: "linear-gradient(135deg, #111827 0%, #374151 100%)" },
]

export function Dock() {
  const router = useRouter()
  const pathname = usePathname()
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const openWindows = useDesktopWindowStore((state) => state.windows)
  const bouncingApp = useDesktopWindowStore((state) => state.bouncingApp)

  const dockRef = useRef<HTMLDivElement>(null)
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ name: string; x: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dockRef.current) return
    const rect = dockRef.current.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMouseX(null)
    setTooltip(null)
  }, [])

  const getScale = useCallback((index: number) => {
    if (mouseX === null || !dockRef.current) return 1
    const itemWidth = 52
    const padding = 10
    const separatorsBefore = DOCK_ITEMS.slice(0, index + 1).filter((item) => item.separatorBefore).length
    const itemCenter = index * (itemWidth + 4) + itemWidth / 2 + padding + separatorsBefore * 12
    const distance = Math.abs(mouseX - itemCenter)
    const maxDist = 100
    if (distance > maxDist) return 1
    return 1 + 0.6 * Math.cos((distance / maxDist) * (Math.PI / 2))
  }, [mouseX])

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
          const isOpen = item.kind === "app"
            ? openWindows.some((w) => w.appId === item.id)
            : pathname === item.href

          const showSeparator = Boolean(item.separatorBefore)

          return (
            <div key={item.id} className="flex items-end">
              {showSeparator && (
                <div className="mx-1 mb-1 h-10 w-px bg-white/20" />
              )}
              <div
                className="relative flex flex-col items-center"
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const dockRect = dockRef.current?.getBoundingClientRect()
                  if (dockRect) {
                    setTooltip({ name: item.name, x: rect.left - dockRect.left + rect.width / 2 })
                  }
                }}
                onMouseLeave={() => {
                  setTooltip(null)
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (item.kind === "route") {
                      router.push(pathname === item.href ? "/desktop" : item.href)
                      return
                    }
                    openApp(item.id)
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-[11px] shadow-lg active:brightness-90 ${
                    item.kind === "app" && bouncingApp === item.id ? "dock-bounce" : ""
                  }`}
                  style={{
                    background: item.color,
                    transform: `scale(${scale}) translateY(${(scale - 1) * -16}px)`,
                    transformOrigin: "bottom",
                    transition: mouseX !== null ? "none" : "transform 0.2s ease-out",
                  }}
                  aria-label={`Open ${item.name}`}
                >
                  <span className="text-[18px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                    {item.iconLetter}
                  </span>
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
