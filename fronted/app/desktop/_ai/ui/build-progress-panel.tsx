"use client"

import { useEffect, useMemo, useState } from "react"

import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildsApi } from "@/lib/api/modules/builds"
import { codingRunsApi } from "@/lib/api/modules/coding-runs"
import { useWorkflowProgressStore } from "@/lib/stores/workflow-progress-store"
import type { WorkflowRun } from "@/shared/contracts/builds"
import type { CodingRun } from "@/shared/contracts/coding-runs"

type ProgressRun = WorkflowRun | CodingRun

function stageLabel(stage: ProgressRun["stage"]) {
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

function workflowLabel(run: ProgressRun | null, kind: "build" | "coding") {
  if (run?.workflowType === "coding-agent" || kind === "coding") {
    return "Coding Workflow"
  }

  return "Build Progress"
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function extractCodingSummary(run: ProgressRun | null) {
  if (!run || run.workflowType !== "coding-agent") {
    return null
  }

  const result = asRecord(run.resultJson)
  const review = asRecord(result?.review)
  return (
    asString(review?.feedback) ??
    asString(result?.reviewRaw) ??
    asString(asRecord(result?.execution)?.summary)
  )
}

function extractCodingCommands(run: ProgressRun | null) {
  if (!run || run.workflowType !== "coding-agent") {
    return []
  }

  const execution = asRecord(asRecord(run.resultJson)?.execution)
  const commands = Array.isArray(execution?.commands) ? execution.commands : []

  return commands
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      command: asString(item.command) ?? "unknown",
      success: Boolean(item.success),
    }))
    .slice(0, 3)
}

export function BuildProgressPanel() {
  const visible = useWorkflowProgressStore((state) => state.visible)
  const activeRunId = useWorkflowProgressStore((state) => state.activeRunId)
  const activeKind = useWorkflowProgressStore((state) => state.activeKind)
  const close = useWorkflowProgressStore((state) => state.close)
  const [run, setRun] = useState<ProgressRun | null>(null)
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
        const next =
          activeKind === "coding"
            ? await codingRunsApi.getRun(activeRunId)
            : await buildsApi.getBuildStatus(activeRunId)
        if (cancelled) return
        setRun(next)
        setError(null)

        if (next.status === "running" || next.status === "queued") {
          timer = setTimeout(poll, 2000)
        }
      } catch (pollError) {
        if (cancelled) return
        setError(
          pollError instanceof Error
            ? pollError.message
            : "Failed to load workflow status"
        )
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
  }, [activeKind, activeRunId, visible])

  const stageText = useMemo(() => {
    if (!run) return "Starting"
    return stageLabel(run.stage)
  }, [run])

  const summaryText = useMemo(() => extractCodingSummary(run), [run])
  const commandItems = useMemo(() => extractCodingCommands(run), [run])

  if (!visible || !activeRunId) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 z-[10015] w-[360px] rounded-xl border border-zinc-300/70 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {workflowLabel(run, activeKind)}
          </p>
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

      {summaryText && (
        <p className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
          {summaryText}
        </p>
      )}

      {commandItems.length > 0 && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Sandbox Commands
          </p>
          <div className="space-y-1">
            {commandItems.map((item, index) => (
              <div
                key={`${item.command}-${index}`}
                className="flex items-center justify-between gap-2 text-xs text-zinc-700"
              >
                <code className="truncate">{item.command}</code>
                <span className={item.success ? "text-emerald-700" : "text-amber-700"}>
                  {item.success ? "ok" : "check"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700">
          {error}
        </p>
      )}
    </div>
  )
}
