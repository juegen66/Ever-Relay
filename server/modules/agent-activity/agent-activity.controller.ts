
import { requireUserId } from "@/server/lib/http/auth"
import { ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import type { AgentActivityFeedQuery } from "@/shared/contracts/agent-activity"

import { agentActivityService } from "./agent-activity.service"

import type { Context } from "hono"

function formatAgentActivity(
  activity: Awaited<ReturnType<typeof agentActivityService.listActivityFeedByUser>>[number]
) {
  return {
    id: activity.id,
    userId: activity.userId,
    agentId: activity.agentId,
    activityType: activity.activityType,
    title: activity.title,
    summary: activity.summary ?? null,
    threadId: activity.threadId ?? null,
    runId: activity.runId ?? null,
    payload: activity.payload ?? {},
    createdAt: activity.createdAt.toISOString(),
  }
}

function formatAgentRegistryEntry(
  entry: Awaited<ReturnType<typeof agentActivityService.listOfflineAgentRegistrations>>[number]
) {
  return {
    id: entry.id,
    agentId: entry.agentId,
    name: entry.name,
    description: entry.description ?? null,
    offlineCapable: entry.offlineCapable,
    metadata: entry.metadata ?? {},
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}

export async function getAgentActivityFeed(
  context: Context<ServerBindings>,
  query: AgentActivityFeedQuery
) {
  const userId = requireUserId(context)
  const activities = await agentActivityService.listActivityFeedByUser(userId, {
    limit: query.limit,
    agentId: query.agentId,
  })

  return ok(context, {
    activities: activities.map(formatAgentActivity),
  })
}

export async function listOfflineAgentRegistrations(context: Context<ServerBindings>) {
  requireUserId(context)

  const agents = await agentActivityService.listOfflineAgentRegistrations()

  return ok(context, {
    agents: agents.map(formatAgentRegistryEntry),
  })
}

