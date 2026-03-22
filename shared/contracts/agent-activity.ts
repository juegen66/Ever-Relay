import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const agentActivityFeedItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  agentId: z.string(),
  activityType: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  threadId: z.string().nullable(),
  runId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
})

export type AgentActivityFeedItem = z.infer<typeof agentActivityFeedItemSchema>

export const agentActivityFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  agentId: z.string().min(1).optional(),
})

export type AgentActivityFeedQuery = z.infer<typeof agentActivityFeedQuerySchema>

export const agentActivityFeedResponseSchema = apiSuccessSchema(
  z.object({
    activities: z.array(agentActivityFeedItemSchema),
  })
)

export const agentRegistryItemSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  offlineCapable: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type AgentRegistryItem = z.infer<typeof agentRegistryItemSchema>

export const agentRegistryResponseSchema = apiSuccessSchema(
  z.object({
    agents: z.array(agentRegistryItemSchema),
  })
)

export const agentActivityContracts = {
  feed: {
    querySchema: agentActivityFeedQuerySchema,
    responseSchema: agentActivityFeedResponseSchema,
  },
  offlineAgents: {
    responseSchema: agentRegistryResponseSchema,
  },
} as const

