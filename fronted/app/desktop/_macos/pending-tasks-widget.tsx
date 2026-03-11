"use client"

import { useState } from "react"

import { ChevronDown, ChevronUp, Circle, Sparkles } from "lucide-react"

import { useWorkingMemoryStore } from "@/lib/stores/working-memory-store"

export function PendingTasksWidget() {
  const state = useWorkingMemoryStore((s) => s.state)
  const [collapsed, setCollapsed] = useState(false)

  const pendingTasks = state?.pendingTasks ?? []
  const activeProjects = state?.activeProjects ?? []
  const currentFocus = state?.currentFocus

  const isEmpty = !currentFocus && pendingTasks.length === 0 && activeProjects.length === 0

  return (
    <div className="fixed bottom-16 right-4 z-[10005] w-[280px] select-none">
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-blue-400 text-blue-400" />
            <span className="text-[13px] font-semibold text-white/90">
              My Tasks
            </span>
            {pendingTasks.length > 0 && (
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
                {pendingTasks.length}
              </span>
            )}
          </div>
          {collapsed ? (
            <ChevronUp className="h-3.5 w-3.5 text-white/40" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-white/40" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-0.5 px-3 pb-3">
            {isEmpty && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Sparkles className="h-5 w-5 text-white/20" />
                <p className="text-[12px] leading-snug text-white/40">
                  Chat with Copilot to start tracking tasks and focus.
                </p>
              </div>
            )}

            {currentFocus && (
              <div className="mb-2 rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  Current Focus
                </p>
                <p className="mt-1 text-[13px] leading-snug text-white/90">
                  {currentFocus}
                </p>
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="space-y-1">
                {pendingTasks.slice(0, 5).map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
                  >
                    <Circle className="mt-0.5 h-3 w-3 shrink-0 text-white/30" />
                    <span className="text-[12px] leading-snug text-white/75">{task}</span>
                  </div>
                ))}
                {pendingTasks.length > 5 && (
                  <p className="px-2 text-[11px] text-white/30">
                    +{pendingTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            )}

            {activeProjects.length > 0 && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-white/40">
                  Active Projects
                </p>
                {activeProjects.slice(0, 3).map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-amber-400/70" />
                      <span className="text-[12px] text-white/75">{project.name}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{project.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
