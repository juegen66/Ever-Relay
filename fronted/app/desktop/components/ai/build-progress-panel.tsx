"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"
import { buildsApi } from "@/lib/api/modules/builds"
import { useBuildProgressStore } from "@/lib/stores/build-progress-store"
import type { WorkflowRun } from "@/shared/contracts/builds"
import { Button } from "@/components/ui/button"

function stageLabel(stage: WorkflowRun["stage"]) {
  switch (stage) {
    case "queued":
      return "Queued"
    case "plan":
      return "Planning"
    case "generate":
      return "Generating"
    case "validate":
      return "Validating"
    case "complete":
      return "Complete"
    case "failed":
      return "Failed"
    default:
      return stage
  }
}

export function BuildProgressPanel() {
  const visible = useBuildProgressStore((state) => state.visible)
  const activeRunId = useBuildProgressStore((state) => state.activeRunId)
  const close = useBuildProgressStore((state) => state.close)
  const [run, setRun] = useState<WorkflowRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible || !activeRunId) {
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      try {
        setLoading(true)
        const next = await buildsApi.getBuildStatus(activeRunId)
        if (cancelled) return
        setRun(next)
        setError(null)

        if (next.status === "running" || next.status === "queued") {
          timer = setTimeout(poll, 2000)
        }
      } catch (pollError) {
        if (cancelled) return
        setError(pollError instanceof Error ? pollError.message : "Failed to load build status")
        timer = setTimeout(poll, 3000)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [activeRunId, visible])

  const stageText = useMemo(() => {
    if (!run) return "Starting"
    return stageLabel(run.stage)
  }, [run])

  if (!visible || !activeRunId) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 z-[10015] w-[360px] rounded-xl border border-zinc-300/70 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Build Progress</p>
          <p className="text-xs text-zinc-500">{activeRunId}</p>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={close}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-1 flex items-center gap-2 text-sm text-zinc-800">
          {(loading || run?.status === "running") && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          )}
          <span>{stageText}</span>
        </div>
        <p className="text-xs text-zinc-500">Status: {run?.status ?? "running"}</p>
      </div>

      {run?.error && (
        <p className="mt-2 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
          {run.error}
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700">
          {error}
        </p>
      )}
    </div>
  )
}

