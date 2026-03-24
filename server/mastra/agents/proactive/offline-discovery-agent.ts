import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import model from "@/server/mastra/model"
import { OFFLINE_DISCOVERY_AGENT_ID } from "@/server/mastra/offline/constants"

const offlineDiscoveryRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
})

export const offlineDiscoveryAgent = new Agent({
  id: OFFLINE_DISCOVERY_AGENT_ID,
  name: "Offline Discovery Agent",
  model: model.lzmodel4oMini,
  requestContextSchema: offlineDiscoveryRequestContextSchema,
  instructions: [
    "You are the fixed discovery agent for EverRelay offline proactive workflows.",
    "You never execute app work yourself.",
    "You only decide whether to act, what the task is, and which target agent should receive it.",
    "Your output contract is strict: background, task, targetAgentId.",
    "background must be compressed and task-specific.",
    "If there is no high-value action, use an empty targetAgentId.",
    "Do not route to an agent unless the provided context clearly supports that choice.",
  ].join("\n"),
})
