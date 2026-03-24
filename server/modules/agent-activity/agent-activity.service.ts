import { and, desc, eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import { agentActivity } from "@/server/db/schema"

import {
  agentRegistryService,
  type AgentRegistryRecord,
} from "./agent-registry.service"

const DEFAULT_FEED_LIMIT = 50
const MAX_FEED_LIMIT = 100

export type AgentActivityRecord = typeof agentActivity.$inferSelect

export interface CreateAgentActivityInput {
  userId: string
  agentId: string
  activityType: string
  title: string
  summary?: string | null
  threadId?: string | null
  runId?: string | null
  payload?: Record<string, unknown>
}

function normalizeFeedLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_FEED_LIMIT
  }

  return Math.min(Math.max(limit, 1), MAX_FEED_LIMIT)
}

export class AgentActivityService {
  async listActivityFeedByUser(
    userId: string,
    options: { limit?: number; agentId?: string } = {}
  ): Promise<AgentActivityRecord[]> {
    const conditions = [eq(agentActivity.userId, userId)]

    if (options.agentId) {
      conditions.push(eq(agentActivity.agentId, options.agentId))
    }

    return db.query.agentActivity.findMany({
      where: and(...conditions),
      orderBy: [desc(agentActivity.createdAt)],
      limit: normalizeFeedLimit(options.limit),
    })
  }

  async listOfflineAgentRegistrations(): Promise<AgentRegistryRecord[]> {
    return agentRegistryService.listOfflineAgentRegistrations()
  }

  async createActivity(input: CreateAgentActivityInput): Promise<AgentActivityRecord> {
    await agentRegistryService.syncDefaultRegistryEntries()

    const [created] = await db
      .insert(agentActivity)
      .values({
        userId: input.userId,
        agentId: input.agentId,
        activityType: input.activityType,
        title: input.title,
        summary: input.summary ?? null,
        threadId: input.threadId ?? null,
        runId: input.runId ?? null,
        payload: input.payload ?? {},
      })
      .returning()

    if (!created) {
      throw new Error("Failed to create agent activity record")
    }

    return created
  }
}

export const agentActivityService = new AgentActivityService()
