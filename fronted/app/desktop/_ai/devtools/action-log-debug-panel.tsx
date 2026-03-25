"use client"

import { useEffect, useState } from "react"

import { Activity, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react"

import {
  useDesktopActionLogStore,
  type DesktopAction,
} from "@/lib/stores/desktop-action-log-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"

import { queueDesktopPredictionRun } from "../lib/prediction-control"

function formatTs(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function actionLabel(action: DesktopAction) {
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
    case "window_focused":
      return `Focused: ${action.appId}`
    case "window_minimized":
      return `Minimized: ${action.appId}`
    case "window_maximized":
      return `Maximized: ${action.appId}`
    case "spotlight_searched":
      return `Searched: "${action.query}"`
    case "canvas_project_opened":
      return `Canvas: ${action.projectName ?? action.projectId}`
    case "context_menu_action":
      return `Menu: ${action.action}`
    case "dock_item_clicked":
      return `Dock: ${action.itemName}`
    case "launchpad_app_clicked":
      return `Launchpad: ${action.appName}`
    case "menubar_action":
      return `MenuBar ${action.menu}: ${action.action}`
    case "control_center_toggled":
      return `Control: ${action.control}=${action.value}`
    case "desktop_icon_selected":
      return `Selected: ${action.itemName}`
    case "desktop_icon_context_menu":
      return `Icon menu: ${action.action}`
    case "notification_dismissed":
      return `Dismissed: ${action.notificationId}`
    case "dialog_opened":
      return `Dialog opened: ${action.dialogId}`
    case "dialog_closed":
      return `Dialog closed: ${action.dialogId}`
    case "keyboard_shortcut":
      return `Shortcut: ${action.shortcut}`
    default:
      return "unknown action"
  }
}

export function ActionLogDebugPanel() {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null)
  const actions = useDesktopActionLogStore((state) => state.actions)
  const silentRunning = useDesktopAgentStore((state) => state.silentRunning)
  const silentStatus = useDesktopAgentStore((state) => state.silentStatus)
  const predictions = usePredictionStore((state) => state.predictions)
  const suggestions = usePredictionStore((state) => state.suggestions)
  const proactiveReminder = usePredictionStore((state) => state.proactiveReminder)
  const lastUpdated = usePredictionStore((state) => state.lastUpdated)
  const isLoading = usePredictionStore((state) => state.isLoading)

  useEffect(() => {
    if (!triggerMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setTriggerMessage(null)
    }, 2400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [triggerMessage])

  const handleTriggerPredict = () => {
    void queueDesktopPredictionRun({ force: true }).then((result) => {
      if (result === "started") {
        setTriggerMessage("Triggered background optimization run.")
        return
      }

      if (result === "restarted") {
        setTriggerMessage("Restarted optimization run with a fresh thread.")
        return
      }

      if (result === "running" || silentRunning || isLoading) {
        setTriggerMessage("Optimizer is already running.")
        return
      }

      setTriggerMessage("Optimizer trigger skipped by debounce.")
    })
  }

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
          {/* Optimization Status */}
          <div className="border-b border-white/10 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Optimization Advisor</p>
              <button
                type="button"
                onClick={handleTriggerPredict}
                disabled={silentStatus === "stopping"}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                Run Optimizer
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isLoading ? "animate-pulse bg-yellow-400" : predictions.length > 0 ? "bg-green-400" : "bg-white/30"}`} />
              <span className="text-[11px] text-white/70">
                {isLoading
                  ? "Analyzing..."
                  : predictions.length > 0
                    ? `${predictions.length} actions, ${suggestions.length} suggestions`
                    : "Idle"}
              </span>
            </div>
            {lastUpdated && (
              <p className="mt-1 text-[10px] text-white/40">
                Last updated: {formatTs(lastUpdated)}
              </p>
            )}
            {triggerMessage && (
              <p className="mt-1 text-[10px] text-cyan-300/80">{triggerMessage}</p>
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
            {proactiveReminder && (
              <div className="mt-2 rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-cyan-100">
                    Top optimization
                  </span>
                  <span className="text-[10px] text-cyan-300">
                    {proactiveReminder.confidence}%
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-tight text-cyan-100/80">
                  {proactiveReminder.title}
                </p>
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
                {[...actions].reverse().slice(0, 20).map((action) => (
                  <div key={`${action.ts}-${action.type}`} className="flex items-center gap-2 rounded px-1.5 py-1 text-[11px] hover:bg-white/5">
                    <span className="shrink-0 font-mono text-[10px] text-white/30">{formatTs(action.ts)}</span>
                    <span className="truncate text-white/70">{actionLabel(action)}</span>
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
