import { readFileSync } from "fs"
import { join } from "path"
import { Agent } from "@mastra/core/agent"
import { z } from "zod"
import model from "@/server/mastra/model"
import { createAgentMemory } from "@/server/mastra/memory"
import {
  createCanvasProjectTool,
  listCanvasProjectsTool,
  updateCanvasProjectTool,
} from "@/server/mastra/tools"

export const BRAND_DESIGNER_AGENT_ID = "brand_designer_agent"

const brandDesignerSkillPath = join(process.cwd(), "skills/brand-designer/SKILL.md")
const brandDesignerPrompt = readFileSync(brandDesignerSkillPath, "utf-8").replace(
  /^---[\s\S]*?---\n/,
  ""
)

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
    "You are the brand design agent. Create logos, color palettes, typography systems, and brand guidelines.",
    "Output structured JSON only.",
    "Never output markdown fences or <think> tags.",
    "Return exactly one logo system object, not an array.",
    "The object must include conceptName, rationaleMd, and logoSvg.full/icon/wordmark (all valid SVG strings).",
    "Do not output planning-only keys such as goal, assumptions, brandPositioning, or logoSystemDirection.",
    "Also include optional colorPalette, typography, and top-level brandGuidelines.",
    "Follow these design principles strictly:",
    brandDesignerPrompt,
  ].join("\n\n"),
  tools: {
    listCanvasProjects: listCanvasProjectsTool,
    createCanvasProject: createCanvasProjectTool,
    updateCanvasProject: updateCanvasProjectTool,
  },
})
