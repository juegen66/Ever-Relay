"use client"

import { useMemo } from "react"

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  Inbox,
  RefreshCw,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useAgentActivitiesQuery,
  type AgentActivity,
} from "@/lib/query/agent-activities"
import { cn } from "@/lib/utils"

type StatusTone = {
  label: string
  className: string
}

const STATUS_TONES: Record<string, StatusTone> = {
  queued: { label: "Queued", className: "border-slate-200 bg-slate-100 text-slate-700" },
  pending: { label: "Pending", className: "border-slate-200 bg-slate-100 text-slate-700" },
  running: { label: "Running", className: "border-amber-200 bg-amber-100 text-amber-800" },
  in_progress: { label: "Running", className: "border-amber-200 bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "border-emerald-200 bg-emerald-100 text-emerald-800" },
  success: { label: "Completed", className: "border-emerald-200 bg-emerald-100 text-emerald-800" },
  failed: { label: "Failed", className: "border-rose-200 bg-rose-100 text-rose-800" },
  error: { label: "Failed", className: "border-rose-200 bg-rose-100 text-rose-800" },
  blocked: { label: "Blocked", className: "border-amber-200 bg-amber-100 text-amber-800" },
  canceled: { label: "Canceled", className: "border-slate-200 bg-slate-100 text-slate-700" },
  cancelled: { label: "Canceled", className: "border-slate-200 bg-slate-100 text-slate-700" },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toText(item))
      .filter((item): item is string => Boolean(item))
    return parts.length > 0 ? parts.join(", ") : null
  }

  if (isRecord(value)) {
    try {
      const json = JSON.stringify(value)
      if (json && json !== "{}") {
        return json.length > 120 ? `${json.slice(0, 117)}...` : json
      }
    } catch {}
  }

  return null
}

function formatRelativeTimestamp(value: string) {
  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    return value
  }

  const diffMs = Date.now() - time
  const diffMinutes = Math.floor(Math.abs(diffMs) / 60_000)
  const isPast = diffMs >= 0

  if (diffMinutes < 1) {
    return isPast ? "Just now" : "Soon"
  }

  if (diffMinutes < 60) {
    return isPast ? `${diffMinutes}m ago` : `in ${diffMinutes}m`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return isPast ? `${diffHours}h ago` : `in ${diffHours}h`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return isPast ? `${diffDays}d ago` : `in ${diffDays}d`
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(time)
}

function formatStatus(status: string): StatusTone {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return STATUS_TONES[normalized] ?? {
    label: status.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    className: "border-slate-200 bg-slate-100 text-slate-700",
  }
}

function getArtifactInfo(activity: AgentActivity) {
  const artifact = activity.artifact
  if (!artifact) {
    return null
  }

  const href = artifact.href ?? artifact.url ?? null
  const label = artifact.label ?? artifact.name ?? "Open artifact"
  const host = href
    ? (() => {
        try {
          return new URL(href).host
        } catch {
          return null
        }
      })()
    : null

  const metadataSource = artifact.metadata ?? activity.metadata ?? null
  const metadataEntries = metadataSource && isRecord(metadataSource)
    ? Object.entries(metadataSource)
        .map(([key, value]) => {
          const text = toText(value)
          return text ? { key, text } : null
        })
        .filter((entry): entry is { key: string; text: string } => Boolean(entry))
        .slice(0, 4)
    : []

  return {
    href,
    label,
    host,
    type: artifact.type ?? artifact.mimeType ?? null,
    metadataEntries,
  }
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-4 w-36 rounded-full bg-slate-200" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-full rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/70 p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Inbox className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-slate-900">No activity yet</p>
          <p className="text-[13px] leading-6 text-slate-600">
            Agent tasks, status changes, and linked artifacts will appear here once the backend starts publishing them.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Refresh feed
        </Button>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-rose-200/80 bg-rose-50/80 p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-rose-950">Activity feed unavailable</p>
          <p className="text-[13px] leading-6 text-rose-900/70">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}

function ActivityCard({ activity }: { activity: AgentActivity }) {
  const statusTone = formatStatus(activity.status)
  const artifact = getArtifactInfo(activity)

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {activity.agent}
          </p>
          <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{activity.task}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={cn("border px-2.5 py-0.5 text-[11px] font-semibold", statusTone.className)}>
            {statusTone.label}
          </Badge>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            {formatRelativeTimestamp(activity.timestamp)}
          </span>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
        {activity.summary}
      </p>

      {artifact && (artifact.href || artifact.metadataEntries.length > 0) ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Artifact
              </p>
              {artifact.href ? (
                <a
                  href={artifact.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-sky-700 transition-colors hover:text-sky-800"
                >
                  <span className="truncate">{artifact.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <p className="mt-1 text-[13px] font-medium text-slate-800">{artifact.label}</p>
              )}
              {artifact.host ? (
                <p className="mt-0.5 text-[11px] text-slate-500">{artifact.host}</p>
              ) : null}
            </div>
            {artifact.type ? (
              <Badge variant="outline" className="border-slate-200 bg-white/80 text-[11px] font-medium text-slate-600">
                {artifact.type}
              </Badge>
            ) : null}
          </div>

          {artifact.metadataEntries.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {artifact.metadataEntries.map((entry) => (
                <span
                  key={`${activity.id}-${entry.key}`}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                >
                  <span className="font-medium text-slate-700">{entry.key}:</span> {entry.text}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unable to load the agent activity feed."
}

export function ActivityApp() {
  const query = useAgentActivitiesQuery()
  const activities = useMemo(() => query.data ?? [], [query.data])

  const isLoading = query.isPending
  const isEmpty = !isLoading && !query.isError && activities.length === 0
  const errorMessage = toErrorMessage(query.error)

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(246,249,252,0.98)_0%,rgba(239,244,249,0.95)_100%)] text-slate-900">
      <div className="border-b border-slate-200/80 bg-white/65 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#06b6d4_100%)] text-white shadow-[0_8px_20px_rgba(8,145,178,0.28)]">
              <Activity className="h-5 w-5" strokeWidth={2.3} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-900">Agent Activity</p>
              <p className="text-[12px] text-slate-500">
                Recent tasks, state changes, and linked artifacts from active agents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {query.isFetching ? "Syncing" : `${activities.length} entries`}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[12px]"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", query.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <ScrollArea className="h-full pr-1">
          <div className="space-y-3">
            {isLoading ? <ActivitySkeleton /> : null}
            {!isLoading && query.isError ? (
              <ErrorState message={errorMessage} onRetry={() => void query.refetch()} />
            ) : null}
            {isEmpty ? <EmptyState onRetry={() => void query.refetch()} /> : null}
            {!isLoading && !query.isError
              ? activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
              : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
