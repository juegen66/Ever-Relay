import { request } from "@/lib/api"
import type { AgentActivityFeedItem } from "@/shared/contracts/agent-activity"

export interface AgentActivityArtifact {
  href?: string
  url?: string
  label?: string
  name?: string
  type?: string
  mimeType?: string
  metadata?: Record<string, unknown> | null
}

export interface AgentActivity {
  id: string
  agent: string
  task: string
  status: string
  summary: string
  timestamp: string
  artifact?: AgentActivityArtifact | null
  metadata?: Record<string, unknown> | null
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  offline_discovery_agent: "Offline Discovery",
  textedit_proactive_agent: "TextEdit",
  main_agent: "Desktop Copilot",
  canvas_agent: "Canvas Copilot",
  logo_agent: "Logo Copilot",
  coding_agent: "Coding Copilot",
  third_party_agent: "Third-Party Copilot",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed) return trimmed
      continue
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

function normalizeArtifact(value: unknown): AgentActivityArtifact | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const href = pickString(record.href, record.url)
  const label = pickString(record.label, record.name)
  const type = pickString(record.type, record.mimeType)
  const metadata = asRecord(record.metadata)

  if (!href && !label && !type && !metadata) {
    return null
  }

  return {
    href: href ?? undefined,
    url: href ?? undefined,
    label: label ?? undefined,
    name: label ?? undefined,
    type: type ?? undefined,
    mimeType: type ?? undefined,
    metadata,
  }
}

function toAgentActivity(item: AgentActivityFeedItem): AgentActivity {
  const payload = asRecord(item.payload)
  const artifact = normalizeArtifact(payload?.artifact)
  const agent =
    pickString(
      payload?.agentName,
      AGENT_DISPLAY_NAMES[item.agentId],
      item.agentId
    ) ?? item.agentId
  const task = pickString(payload?.task, item.title) ?? item.title
  const status = pickString(payload?.status, item.activityType) ?? item.activityType
  const summary = pickString(item.summary, payload?.background) ?? ""

  return {
    id: item.id,
    agent,
    task,
    status,
    summary,
    timestamp: item.createdAt,
    artifact,
    metadata: payload,
  }
}

export const agentActivitiesApi = {
  async list(options: { limit?: number; agentId?: string } = {}) {
    const params = new URLSearchParams()

    if (typeof options.limit === "number") {
      params.set("limit", String(options.limit))
    }

    if (options.agentId) {
      params.set("agentId", options.agentId)
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : ""
    const payload = await request.get<{ activities: AgentActivityFeedItem[] }>(
      `/agent-activity/feed${suffix}`
    )

    return payload.activities.map(toAgentActivity)
  },
}
