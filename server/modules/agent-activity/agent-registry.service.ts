import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/server/core/database"
import { agentRegistry } from "@/server/db/schema"
import {
  DEFAULT_AGENT_REGISTRY_ENTRIES,
  OFFLINE_PROACTIVE_RUNNABLE_AGENT_IDS,
  type DefaultAgentRegistryEntry,
} from "@/server/mastra/offline/constants"

export type AgentRegistryRecord = typeof agentRegistry.$inferSelect

const runnableOfflineAgentIds = new Set<string>(OFFLINE_PROACTIVE_RUNNABLE_AGENT_IDS)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function serializeRegistryEntry(entry: DefaultAgentRegistryEntry) {
  return {
    agentId: entry.agentId,
    name: entry.name,
    description: entry.description,
    offlineCapable: entry.offlineCapable,
    metadata: entry.metadata,
  }
}

function runtimeAgentKeyFor(record: Pick<AgentRegistryRecord, "agentId" | "metadata">) {
  const runtimeAgentKey = isRecord(record.metadata)
    ? record.metadata.runtimeAgentKey
    : null

  return typeof runtimeAgentKey === "string" && runtimeAgentKey.trim()
    ? runtimeAgentKey
    : record.agentId
}

function supportsOfflineWorkflow(
  record: Pick<AgentRegistryRecord, "agentId" | "metadata" | "offlineCapable">
) {
  if (!record.offlineCapable) {
    return false
  }

  if (!runnableOfflineAgentIds.has(record.agentId)) {
    return false
  }

  if (!isRecord(record.metadata)) {
    return true
  }

  const enabled = record.metadata.offlineWorkflowEnabled
  return enabled !== false
}

function supportsParallelWorkflow(
  record: Pick<AgentRegistryRecord, "metadata">
) {
  if (!isRecord(record.metadata)) {
    return false
  }

  return record.metadata.parallelWorkflowEnabled === true
}

export class AgentRegistryService {
  private syncPromise: Promise<void> | null = null

  async syncDefaultRegistryEntries() {
    if (!this.syncPromise) {
      this.syncPromise = db
        .insert(agentRegistry)
        .values(DEFAULT_AGENT_REGISTRY_ENTRIES.map(serializeRegistryEntry))
        .onConflictDoNothing()
        .then(() => undefined)
        .catch((error) => {
          this.syncPromise = null
          throw error
        })
    }

    await this.syncPromise
  }

  async listOfflineAgentRegistrations(): Promise<AgentRegistryRecord[]> {
    await this.syncDefaultRegistryEntries()

    return db.query.agentRegistry.findMany({
      where: eq(agentRegistry.offlineCapable, true),
      orderBy: [asc(agentRegistry.name)],
    })
  }

  async listParallelWorkflowAgentRegistrations(): Promise<AgentRegistryRecord[]> {
    await this.syncDefaultRegistryEntries()

    const rows = await db.query.agentRegistry.findMany({
      orderBy: [asc(agentRegistry.name)],
    })

    return rows.filter((row) => supportsParallelWorkflow(row))
  }

  async listParallelWorkflowRuntimeAgentIds(): Promise<string[]> {
    const rows = await this.listParallelWorkflowAgentRegistrations()

    return rows
      .map((row) => runtimeAgentKeyFor(row).trim())
      .filter(Boolean)
  }

  async listRunnableOfflineAgents(): Promise<AgentRegistryRecord[]> {
    await this.syncDefaultRegistryEntries()

    const rows = await db.query.agentRegistry.findMany({
      where: and(
        eq(agentRegistry.offlineCapable, true),
        inArray(agentRegistry.agentId, [...OFFLINE_PROACTIVE_RUNNABLE_AGENT_IDS])
      ),
      orderBy: [asc(agentRegistry.name)],
    })

    return rows.filter((row) => supportsOfflineWorkflow(row))
  }

  async getRegistration(agentId: string): Promise<AgentRegistryRecord | null> {
    await this.syncDefaultRegistryEntries()

    const row = await db.query.agentRegistry.findFirst({
      where: eq(agentRegistry.agentId, agentId),
      orderBy: [desc(agentRegistry.updatedAt)],
    })

    return row ?? null
  }

  async getRunnableRegistration(agentId: string): Promise<AgentRegistryRecord | null> {
    const row = await this.getRegistration(agentId)
    if (!row || !supportsOfflineWorkflow(row)) {
      return null
    }
    return row
  }

  resolveRuntimeAgentId(record: Pick<AgentRegistryRecord, "agentId" | "metadata">) {
    return runtimeAgentKeyFor(record)
  }
}

export const agentRegistryService = new AgentRegistryService()
