"use client"

import { useState } from "react"

import { Activity, ChevronDown, ChevronUp, X } from "lucide-react"

import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"

function formatTs(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function actionLabel(action: { type: string; [k: string]: unknown }) {
  switch (action.type) {
    case "app_opened":
      return `Opened app: ${action.appId}`
    case "file_opened":
      return `Opened file: ${action.fileName}`
    case "folder_opened":
      return `Opened folder: ${action.folderName}`
    case "file_edited":
      return `Edited file: ${action.fileId}`
    case "window_closed":
      return `Closed: ${action.title ?? action.appId}`
    case "spotlight_searched":
      return `Searched: "${action.query}"`
    case "canvas_project_opened":
      return `Canvas: ${action.projectName ?? action.projectId}`
    case "context_menu_action":
      return `Menu: ${action.action}`
    default:
      return action.type
  }
}

export function ActionLogDebugPanel() {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const actions = useDesktopActionLogStore((state) => state.actions)
  const predictions = usePredictionStore((state) => state.predictions)
  const suggestions = usePredictionStore((state) => state.suggestions)
  const lastUpdated = usePredictionStore((state) => state.lastUpdated)
  const isLoading = usePredictionStore((state) => state.isLoading)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-20 left-3 z-[10050] flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-black/70 px-3 text-[11px] font-medium text-white/80 shadow-lg backdrop-blur transition hover:bg-black/80"
        title="Show AI Context Debug Panel"
      >
        <Activity className="h-3.5 w-3.5 text-green-400" />
        AI Context
        {actions.length > 0 && (
          <span className="ml-1 rounded-full bg-green-500/20 px-1.5 text-[10px] text-green-400">
            {actions.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 left-3 z-[10050] w-[360px] overflow-hidden rounded-xl border border-white/15 bg-black/85 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-green-400" />
          <span className="text-[12px] font-semibold text-white/90">AI Context Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white/80">
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setVisible(false)} className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white/80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-[400px] overflow-auto">
          {/* Prediction Status */}
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Prediction Engine</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isLoading ? "animate-pulse bg-yellow-400" : predictions.length > 0 ? "bg-green-400" : "bg-white/30"}`} />
              <span className="text-[11px] text-white/70">
                {isLoading
                  ? "Analyzing..."
                  : predictions.length > 0
                    ? `${predictions.length} predictions, ${suggestions.length} suggestions`
                    : "Idle"}
              </span>
            </div>
            {lastUpdated && (
              <p className="mt-1 text-[10px] text-white/40">
                Last updated: {formatTs(lastUpdated)}
              </p>
            )}
            {predictions.length > 0 && (
              <div className="mt-2 space-y-1">
                {predictions.map((p) => (
                  <div key={p.id} className="rounded-md bg-white/5 px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white/80">{p.title}</span>
                      <span className="text-[10px] text-green-400">{p.confidence}%</span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-tight text-white/40">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Log */}
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Action Log ({actions.length}/50)
            </p>
            {actions.length === 0 ? (
              <p className="mt-2 text-[11px] text-white/30">No actions recorded yet. Try opening apps, files, or searching.</p>
            ) : (
              <div className="mt-1.5 space-y-0.5">
                {[...actions].reverse().slice(0, 20).map((action, i) => (
                  <div key={`${action.ts}-${i}`} className="flex items-center gap-2 rounded px-1.5 py-1 text-[11px] hover:bg-white/5">
                    <span className="shrink-0 font-mono text-[10px] text-white/30">{formatTs(action.ts)}</span>
                    <span className="truncate text-white/70">{actionLabel(action as any)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
