"use client"

import { useMemo } from "react"

import { Activity } from "lucide-react"

import type { AppId } from "@/lib/desktop/types"
import { useTrackAction } from "@/lib/hooks/use-track-action"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { getThirdPartyAppIdForSlug, useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"

const BASE_LAUNCHPAD_APPS: { id: AppId; name: string; color: string; letter: string }[] = [
  { id: "finder", name: "Finder", color: "linear-gradient(135deg, #1e90ff 0%, #0055d4 100%)", letter: "F" },
  { id: "canvas", name: "Canvas", color: "linear-gradient(135deg, #ff9f1c 0%, #ff6a00 100%)", letter: "C" },
  { id: "logo", name: "Logo Studio", color: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", letter: "LG" },
  { id: "vibecoding", name: "Coding Apps", color: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)", letter: "CA" },
  { id: "report", name: "Predict Report", color: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", letter: "PR" },
  { id: "activity", name: "Agent Activity", color: "linear-gradient(135deg, #0f766e 0%, #06b6d4 100%)", letter: "AA" },
  { id: "plugins", name: "Plugin Manager", color: "linear-gradient(135deg, #b45309 0%, #0f766e 100%)", letter: "PM" },
]

export function Launchpad() {
  const track = useTrackAction()
  const onOpenApp = useDesktopWindowStore((state) => state.openApp)
  const onClose = useDesktopUIStore((state) => state.closeLaunchpad)
  const thirdPartyManifestsRecord = useThirdPartyAppRegistry((s) => s.manifests)
  const thirdPartyManifests = useMemo(
    () => Object.values(thirdPartyManifestsRecord),
    [thirdPartyManifestsRecord],
  )

  const launchpadApps = useMemo(() => {
    const extra = thirdPartyManifests.map((m) => ({
      id: getThirdPartyAppIdForSlug(m.slug) as AppId,
      name: m.displayName,
      color: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      letter: m.displayName
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
    }))
    return [...BASE_LAUNCHPAD_APPS, ...extra]
  }, [thirdPartyManifests])

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
        {launchpadApps.map((app) => (
          <button
            key={app.id}
            className="flex flex-col items-center gap-2 group"
            onClick={() => {
              track({ type: "launchpad_app_clicked", appId: app.id, appName: app.name })
              onOpenApp(app.id)
              onClose()
            }}
          >
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] shadow-lg transition-transform group-hover:scale-110 group-active:scale-95"
              style={{ background: app.color }}
            >
              {app.id === "activity" ? (
                <Activity className="h-8 w-8 text-white drop-shadow-sm" strokeWidth={2.2} />
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
