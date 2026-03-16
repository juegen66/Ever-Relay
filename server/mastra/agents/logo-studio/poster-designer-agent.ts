import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { canvasDesignPrompt } from "@/server/mastra/prompts/logo-workflow-prompt"
import {
  createCanvasProjectTool,
  listCanvasProjectsTool,
  renderSvgToPngTool,
  updateCanvasProjectTool,
} from "@/server/mastra/tools"

export const POSTER_DESIGNER_AGENT_ID = "poster_designer_agent"

const posterDesignerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const posterDesignerAgent = new Agent({
  id: POSTER_DESIGNER_AGENT_ID,
  name: "Poster Designer",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: posterDesignerRequestContextSchema,
  instructions: [
    "You create visual art: design philosophy first, then express on canvas.",
    "Fonts are available at skills/canvas-design/canvas-fonts/.",
    "Output structured JSON only.",
    "Never output markdown fences or <think> tags.",
    "Return exactly one poster object, not an array.",
    "The object must include posterSvg (valid SVG string) and may include rationaleMd.",
    "Include optional philosophyMd for overall design rationale.",
    "If you need a PNG preview, use render_svg_to_png with your generated SVG.",
    "Follow these design principles:",
    canvasDesignPrompt,
  ].join("\n\n"),
  tools: {
    listCanvasProjects: listCanvasProjectsTool,
    createCanvasProject: createCanvasProjectTool,
    updateCanvasProject: updateCanvasProjectTool,
    renderSvgToPng: renderSvgToPngTool,
  },
})
