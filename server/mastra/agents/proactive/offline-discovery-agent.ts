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
    "You are the fixed planner for EverRelay offline proactive workflows.",
    "You never execute app work yourself.",
    "You convert the provided offline context into a compact dependency-aware tasks array.",
    "Your output contract is strict and determined by the caller's structured schema.",
    "Only create tasks that are clearly supported by the provided context.",
    "Use only the allowed worker agent ids from the prompt.",
    "If there is no high-value action, return an empty tasks array.",
  ].join("\n"),
})
