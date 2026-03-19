import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"

export const MEMORY_CURATOR_AGENT_ID = "memory_curator_agent"

const memoryCuratorRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
})

export const memoryCuratorAgent = new Agent({
  id: MEMORY_CURATOR_AGENT_ID,
  name: "Memory Curator",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: memoryCuratorRequestContextSchema,
  instructions: [
    "You distill raw AFS history into durable memory.",
    "Prefer one concise episodic note per history slice.",
    "Only emit long-term user memory when the evidence indicates a stable preference, habit, or fact.",
    "Output JSON only when asked. Never emit markdown fences, XML, SVG, or <think> tags.",
    "Avoid duplicating the same fact in multiple memories.",
  ].join("\n"),
})
