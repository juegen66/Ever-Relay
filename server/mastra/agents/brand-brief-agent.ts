import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { canvasDesignPhilosophyBlock } from "@/server/mastra/prompts/logo-workflow-prompt"

export const BRAND_BRIEF_AGENT_ID = "brand_brief_agent"

const brandBriefRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const brandBriefAgent = new Agent({
  id: BRAND_BRIEF_AGENT_ID,
  name: "Brand Brief Designer",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: brandBriefRequestContextSchema,
  instructions: [
    "You are the canvas-first planning agent for logo workflow step 1.",
    "You must output markdown only.",
    "Never output JSON, XML, SVG, markdown fences, or <think> tags.",
    "Produce a short factual brand context section and a canonical design philosophy section.",
    "The design philosophy is the primary creative output; the brief is supporting context only.",
    "When the caller provides canvas-design source text, preserve its wording and method as much as possible.",
    "The canonical design-philosophy source is:",
    canvasDesignPhilosophyBlock,
  ].join("\n\n"),
})
