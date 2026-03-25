import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"

import { PREFERRED_WORKSTYLE_SKILL_NAME } from "@/server/afs/preference-skill"
import { afsSkillService } from "@/server/afs/skill"
import { db } from "@/server/core/database"
import { afsHistory, afsMemory, desktopItems } from "@/server/db/schema"
import type { AgentRegistryRecord } from "@/server/modules/agent-activity/agent-registry.service"
import {
  workingMemorySchema,
  type WorkingMemoryState,
} from "@/shared/contracts/working-memory"

const RECENT_TEXT_FILE_LIMIT = 5
const RECENT_HISTORY_LIMIT = 8
const RECENT_MEMORY_LIMIT = 6
const FULL_RECENT_HISTORY_LIMIT = 15
const FULL_RECENT_MEMORY_LIMIT = 20
const RECENT_ACTIVITY_LIMIT = 5
const ACTIVE_WINDOW_MS = 45 * 60 * 1000
const USER_ACTIVITY_BUCKETS = ["actions", "sessions", "canvas-activity"] as const

export interface OfflineCandidateFile {
  id: string
  name: string
  parentId: string | null
  contentVersion: number
  updatedAt: string
  preview: string
}

export interface OfflineHistorySignal {
  id: string
  scope: string
  bucket: string
  actionType: string | null
  status: string | null
  content: string
  createdAt: string
  metadata: Record<string, unknown>
}

export interface OfflineMemorySignal {
  scope: string
  bucket: string
  path: string
  name: string
  content: string
  updatedAt: string
}

export interface OfflineDiscoveryContext {
  userId: string
  workingMemory: WorkingMemoryState | null
  preferredWorkstyle: string | null
  preferredWorkstyleDescription: string | null
  recentTextFiles: OfflineCandidateFile[]
  recentHistory: OfflineHistorySignal[]
  recentMemories: OfflineMemorySignal[]
  lastActivityAt: string | null
  isRecentlyActive: boolean
}

export interface OfflineFullContext extends OfflineDiscoveryContext {}

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1)}…`
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) {
    return ""
  }

  return entries
    .slice(0, 4)
    .map(
      ([key, value]) =>
        `${key}=${typeof value === "string" ? truncate(value, 80) : JSON.stringify(value)}`
    )
    .join(", ")
}

function formatRunnableAgents(registrations: AgentRegistryRecord[]) {
  if (registrations.length === 0) {
    return "- none"
  }

  return registrations
    .map((entry) => {
      const metadata = entry.metadata ?? {}
      const appId =
        typeof metadata.appId === "string" && metadata.appId.trim()
          ? metadata.appId
          : "unknown"

      return `- ${entry.agentId} | ${entry.name} | app=${appId} | ${entry.description ?? "No description"}`
    })
    .join("\n")
}

function formatRecentTextFiles(recentTextFiles: OfflineCandidateFile[]) {
  return recentTextFiles.length > 0
    ? recentTextFiles
        .map((file) =>
          [
            `- id=${file.id} | name=${file.name} | version=${file.contentVersion} | updatedAt=${file.updatedAt}`,
            `  preview=${file.preview}`,
          ].join("\n")
        )
        .join("\n")
    : "- none"
}

function formatRecentHistory(recentHistory: OfflineHistorySignal[]) {
  return recentHistory.length > 0
    ? recentHistory
        .map((entry) => {
          const head = [
            `- ${entry.createdAt}`,
            `scope=${entry.scope}`,
            `bucket=${entry.bucket}`,
            entry.actionType ? `action=${entry.actionType}` : null,
            entry.status ? `status=${entry.status}` : null,
          ]
            .filter(Boolean)
            .join(" | ")
          const metadata = formatMetadata(entry.metadata)

          return metadata
            ? `${head}\n  content=${entry.content}\n  metadata=${metadata}`
            : `${head}\n  content=${entry.content}`
        })
        .join("\n")
    : "- none"
}

function formatRecentMemories(recentMemories: OfflineMemorySignal[]) {
  return recentMemories.length > 0
    ? recentMemories
        .map(
          (entry) =>
            `- ${entry.updatedAt} | ${entry.scope}/${entry.bucket}${entry.path}/${entry.name}\n  content=${entry.content}`
        )
        .join("\n")
    : "- none"
}

export class OfflineContextService {
  async getDiscoveryContext(userId: string): Promise<OfflineDiscoveryContext> {
    const [workingMemory, preferredWorkstyle, recentTextFiles, recentHistory, recentMemories] =
      await Promise.all([
        this.getWorkingMemory(userId),
        afsSkillService.loadSkillByName(
          userId,
          PREFERRED_WORKSTYLE_SKILL_NAME,
          null,
          "Desktop"
        ),
        this.listRecentTextFiles(userId),
        this.listRecentHistory(userId),
        this.listRecentMemories(userId),
      ])

    const { lastActivityAt, isRecentlyActive } = this.getActivityGate(recentHistory)

    return {
      userId,
      workingMemory,
      preferredWorkstyle: preferredWorkstyle?.content ?? null,
      preferredWorkstyleDescription: preferredWorkstyle?.description ?? null,
      recentTextFiles,
      recentHistory,
      recentMemories,
      lastActivityAt,
      isRecentlyActive,
    }
  }

  async getFullContext(userId: string): Promise<OfflineFullContext> {
    const [
      workingMemory,
      preferredWorkstyle,
      recentTextFiles,
      recentHistory,
      recentMemories,
      recentUserActivity,
    ] = await Promise.all([
      this.getWorkingMemory(userId),
      afsSkillService.loadSkillByName(
        userId,
        PREFERRED_WORKSTYLE_SKILL_NAME,
        null,
        "Desktop"
      ),
      this.listRecentTextFiles(userId),
      this.listFullRecentHistory(userId),
      this.listFullRecentMemories(userId),
      this.listRecentUserActivity(userId),
    ])

    const { lastActivityAt, isRecentlyActive } =
      this.getActivityGate(recentUserActivity)

    return {
      userId,
      workingMemory,
      preferredWorkstyle: preferredWorkstyle?.content ?? null,
      preferredWorkstyleDescription: preferredWorkstyle?.description ?? null,
      recentTextFiles,
      recentHistory,
      recentMemories,
      lastActivityAt,
      isRecentlyActive,
    }
  }

  formatDiscoveryPrompt(
    context: OfflineDiscoveryContext,
    runnableAgents: AgentRegistryRecord[]
  ) {
    const workingMemoryText = context.workingMemory
      ? JSON.stringify(context.workingMemory, null, 2)
      : "null"

    return [
      "You are the fixed discovery agent for EverRelay offline proactive workflows.",
      "Your job is to decide whether the system should act for this user right now.",
      "If there is a high-value actionable task, choose exactly one target agent from the provided runnable list.",
      "If there is no strong opportunity, return an empty targetAgentId and explain the skip reason in background.",
      "",
      "Output contract rules:",
      "- Output exactly three fields: background, task, targetAgentId.",
      "- background must contain only the facts needed by the target agent.",
      "- Do not dump all observations. Compress aggressively.",
      "- If you choose the TextEdit proactive agent, background must explicitly include source file id, source file name, and source content version.",
      "- If the user appears active right now, do not act.",
      "",
      `User id: ${context.userId}`,
      `Last activity at: ${context.lastActivityAt ?? "none"}`,
      `Recently active: ${context.isRecentlyActive ? "yes" : "no"}`,
      "",
      "Runnable offline agents:",
      formatRunnableAgents(runnableAgents),
      "",
      "Working memory:",
      workingMemoryText,
      "",
      "Preferred workstyle skill:",
      context.preferredWorkstyle ?? "none",
      "",
      "Preferred workstyle summary:",
      context.preferredWorkstyleDescription ?? "none",
      "",
      "Recent Desktop memory signals:",
      formatRecentMemories(context.recentMemories),
      "",
      "Recent TextEdit candidates:",
      formatRecentTextFiles(context.recentTextFiles),
      "",
      "Recent activity history:",
      formatRecentHistory(context.recentHistory),
    ].join("\n")
  }

  formatFullContext(
    context: OfflineFullContext,
    runnableAgents: AgentRegistryRecord[]
  ) {
    const workingMemoryText = context.workingMemory
      ? JSON.stringify(context.workingMemory, null, 2)
      : "null"

    return [
      "Offline proactive planning context.",
      "This snapshot spans all available AFS scopes, memory buckets, and recent history buckets.",
      "The recently-active gate is computed from user activity buckets only, not background workflow logs.",
      "",
      `User id: ${context.userId}`,
      `Last user activity at: ${context.lastActivityAt ?? "none"}`,
      `Recently active: ${context.isRecentlyActive ? "yes" : "no"}`,
      "",
      "Runnable offline agents:",
      formatRunnableAgents(runnableAgents),
      "",
      "Working memory:",
      workingMemoryText,
      "",
      "Preferred workstyle skill:",
      context.preferredWorkstyle ?? "none",
      "",
      "Preferred workstyle summary:",
      context.preferredWorkstyleDescription ?? "none",
      "",
      "Recent memories across all scopes and buckets:",
      formatRecentMemories(context.recentMemories),
      "",
      "Recent TextEdit candidates:",
      formatRecentTextFiles(context.recentTextFiles),
      "",
      "Recent AFS history across all scopes and buckets:",
      formatRecentHistory(context.recentHistory),
    ].join("\n")
  }

  private getActivityGate(recentHistory: OfflineHistorySignal[]) {
    const lastActivityAt = recentHistory[0]?.createdAt ?? null
    const lastActivityTs = lastActivityAt ? Date.parse(lastActivityAt) : Number.NaN
    const isRecentlyActive =
      Number.isFinite(lastActivityTs) &&
      Date.now() - lastActivityTs >= 0 &&
      Date.now() - lastActivityTs < ACTIVE_WINDOW_MS

    return {
      lastActivityAt,
      isRecentlyActive,
    }
  }

  private async getWorkingMemory(userId: string): Promise<WorkingMemoryState | null> {
    const resource = await db.execute<{ workingMemory: string | null }>(sql`
      select "workingMemory"
      from mastra_resources
      where id = ${userId}
      limit 1
    `)
    const parsed = safeJsonParse<unknown>(
      resource.rows[0] && typeof resource.rows[0].workingMemory === "string"
        ? resource.rows[0].workingMemory
        : null
    )

    const result = workingMemorySchema.safeParse(parsed)
    return result.success ? result.data : null
  }

  private async listRecentTextFiles(userId: string): Promise<OfflineCandidateFile[]> {
    const rows = await db.query.desktopItems.findMany({
      where: and(
        eq(desktopItems.userId, userId),
        eq(desktopItems.itemType, "text")
      ),
      orderBy: [desc(desktopItems.updatedAt)],
      limit: RECENT_TEXT_FILE_LIMIT,
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      contentVersion: row.contentVersion,
      updatedAt: row.updatedAt.toISOString(),
      preview: truncate(row.content ?? "", 900),
    }))
  }

  private async listRecentHistory(userId: string): Promise<OfflineHistorySignal[]> {
    const rows = await db.query.afsHistory.findMany({
      where: and(
        eq(afsHistory.userId, userId),
        inArray(afsHistory.bucket, ["actions", "workflow-runs"])
      ),
      orderBy: [desc(afsHistory.createdAt)],
      limit: RECENT_HISTORY_LIMIT,
    })

    return rows.map((row) => ({
      id: row.id,
      scope: row.scope,
      bucket: row.bucket,
      actionType: row.actionType ?? null,
      status: row.status ?? null,
      content: truncate(row.content, 320),
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata ?? {},
    }))
  }

  private async listFullRecentHistory(userId: string): Promise<OfflineHistorySignal[]> {
    const rows = await db.query.afsHistory.findMany({
      where: eq(afsHistory.userId, userId),
      orderBy: [desc(afsHistory.createdAt)],
      limit: FULL_RECENT_HISTORY_LIMIT,
    })

    return rows.map((row) => ({
      id: row.id,
      scope: row.scope,
      bucket: row.bucket,
      actionType: row.actionType ?? null,
      status: row.status ?? null,
      content: truncate(row.content, 320),
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata ?? {},
    }))
  }

  private async listRecentUserActivity(
    userId: string
  ): Promise<OfflineHistorySignal[]> {
    const rows = await db.query.afsHistory.findMany({
      where: and(
        eq(afsHistory.userId, userId),
        inArray(afsHistory.bucket, [...USER_ACTIVITY_BUCKETS])
      ),
      orderBy: [desc(afsHistory.createdAt)],
      limit: RECENT_ACTIVITY_LIMIT,
    })

    return rows.map((row) => ({
      id: row.id,
      scope: row.scope,
      bucket: row.bucket,
      actionType: row.actionType ?? null,
      status: row.status ?? null,
      content: truncate(row.content, 320),
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata ?? {},
    }))
  }

  private async listRecentMemories(userId: string): Promise<OfflineMemorySignal[]> {
    const rows = await db.query.afsMemory.findMany({
      where: and(
        eq(afsMemory.userId, userId),
        eq(afsMemory.scope, "Desktop"),
        inArray(afsMemory.bucket, ["user", "note"]),
        isNull(afsMemory.deletedAt)
      ),
      orderBy: [desc(afsMemory.updatedAt)],
      limit: RECENT_MEMORY_LIMIT,
    })

    return rows.map((row) => ({
      scope: row.scope,
      bucket: row.bucket,
      path: row.path,
      name: row.name,
      content: truncate(row.content, 220),
      updatedAt: row.updatedAt.toISOString(),
    }))
  }

  private async listFullRecentMemories(userId: string): Promise<OfflineMemorySignal[]> {
    const rows = await db.query.afsMemory.findMany({
      where: and(
        eq(afsMemory.userId, userId),
        isNull(afsMemory.deletedAt)
      ),
      orderBy: [desc(afsMemory.updatedAt)],
      limit: FULL_RECENT_MEMORY_LIMIT,
    })

    return rows.map((row) => ({
      scope: row.scope,
      bucket: row.bucket,
      path: row.path,
      name: row.name,
      content: truncate(row.content, 220),
      updatedAt: row.updatedAt.toISOString(),
    }))
  }
}

export const offlineContextService = new OfflineContextService()
