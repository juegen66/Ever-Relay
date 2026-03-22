"use client"

import { useState, useRef, useCallback, useMemo } from "react"

import { Activity, Bot, Cloud, FileBarChart, FolderOpen, GitBranch, Palette, PenTool, Terminal } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import type { AppId } from "@/lib/desktop/types"
import { useTrackAction } from "@/lib/hooks/use-track-action"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { getThirdPartyAppIdForSlug, useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"

import type { LucideIcon } from "lucide-react"

interface DockItemBase {
  name: string
  icon: LucideIcon
  color: string
  separatorBefore?: boolean
}

interface DockAppItem extends DockItemBase {
  kind: "app"
  id: AppId
}

interface DockRouteItem extends DockItemBase {
  kind: "route"
  id: "copilot-chat" | "no-chatbot-dashboard"
  href: "/desktop/chat" | "/desktop/no-chatbot"
}

type DockItem = DockAppItem | DockRouteItem

const BASE_DOCK_ITEMS: DockItem[] = [
  { kind: "app", id: "finder", name: "Finder", icon: FolderOpen, color: "linear-gradient(135deg, #1e90ff 0%, #0055d4 100%)" },
  { kind: "app", id: "canvas", name: "Canvas", icon: Palette, color: "linear-gradient(135deg, #ff9f1c 0%, #ff6a00 100%)" },
  { kind: "app", id: "logo", name: "Logo Studio", icon: PenTool, color: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" },
  { kind: "app", id: "vibecoding", name: "Coding Apps", icon: Terminal, color: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)" },
  { kind: "app", id: "report", name: "Predict Report", icon: FileBarChart, color: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" },
  { kind: "app", id: "activity", name: "Agent Activity", icon: Activity, color: "linear-gradient(135deg, #0f766e 0%, #06b6d4 100%)" },
  { kind: "route", id: "copilot-chat", href: "/desktop/chat", name: "Copilot", icon: Bot, color: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)" },
  { kind: "route", id: "no-chatbot-dashboard", href: "/desktop/no-chatbot", name: "No Chatbot", icon: GitBranch, color: "linear-gradient(135deg, #111827 0%, #374151 100%)" },
]

export function Dock() {
  const router = useRouter()
  const pathname = usePathname()
  const track = useTrackAction()
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const openWindows = useDesktopWindowStore((state) => state.windows)
  const bouncingApp = useDesktopWindowStore((state) => state.bouncingApp)
  const thirdPartyManifestsRecord = useThirdPartyAppRegistry((s) => s.manifests)
  const thirdPartyManifests = useMemo(
    () => Object.values(thirdPartyManifestsRecord),
    [thirdPartyManifestsRecord],
  )

  const dockItems = useMemo((): DockItem[] => {
    const tpItems: DockAppItem[] = thirdPartyManifests.map((m) => ({
      kind: "app",
      id: getThirdPartyAppIdForSlug(m.slug) as AppId,
      name: m.displayName,
      icon: Cloud,
      color: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      separatorBefore: false,
    }))
    const reportIdx = BASE_DOCK_ITEMS.findIndex((i) => i.kind === "app" && i.id === "report")
    if (reportIdx === -1) return [...BASE_DOCK_ITEMS.slice(0, -2), ...tpItems, ...BASE_DOCK_ITEMS.slice(-2)]
    const before = BASE_DOCK_ITEMS.slice(0, reportIdx + 1)
    const after = BASE_DOCK_ITEMS.slice(reportIdx + 1)
    return [...before, ...tpItems, ...after]
  }, [thirdPartyManifests])

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

  const getScale = (index: number) => {
    if (mouseX === null) return 1
    const itemWidth = 52
    const padding = 10
    const separatorsBefore = dockItems.slice(0, index + 1).filter((item) => item.separatorBefore).length
    const itemCenter = index * (itemWidth + 4) + itemWidth / 2 + padding + separatorsBefore * 12
    const distance = Math.abs(mouseX - itemCenter)
    const maxDist = 100
    if (distance > maxDist) return 1
    return 1 + 0.6 * Math.cos((distance / maxDist) * (Math.PI / 2))
  }

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
        {dockItems.map((item, index) => {
          const Icon = item.icon
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
                    track({ type: "dock_item_clicked", itemId: item.id, itemName: item.name })
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
                  <Icon className="h-5 w-5 text-white drop-shadow-sm" strokeWidth={2.5} />
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
