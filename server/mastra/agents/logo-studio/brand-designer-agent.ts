import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"

export const BRAND_DESIGNER_AGENT_ID = "brand_designer_agent"

const brandDesignerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const brandDesignerAgent = new Agent({
  id: BRAND_DESIGNER_AGENT_ID,
  name: "Brand Designer",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: brandDesignerRequestContextSchema,
  instructions: [
    "You are the brand design agent.",
    "Translate the provided canonical design philosophy into one coherent logo system.",
    "Output structured JSON only.",
    "Never output markdown fences or <think> tags.",
    "Return exactly one top-level JSON object that matches the caller's schema.",
    "If the caller asks for lockups or concept arrays, obey that schema exactly.",
    "Do not output planning-only keys such as goal, assumptions, brandPositioning, or logoSystemDirection.",
    "Also include optional colorPalette, typography, and top-level brandGuidelines.",
    "When the caller provides canvas-design source text and a canonical philosophy, treat them as the primary creative authority.",
    "The caller will provide the exact JSON schema and SVG lockup contract. Obey that contract strictly.",
  ].join("\n\n"),
})
