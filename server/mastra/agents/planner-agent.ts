import { Agent } from "@mastra/core/agent"
import { z } from "zod"
import model from "@/server/mastra/model"
import {
  listCanvasProjectsTool,
  listDesktopItemsTool,
} from "@/server/mastra/tools"

export const PLANNER_AGENT_ID = "planner_agent"

const plannerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const plannerAgent = new Agent({
  id: PLANNER_AGENT_ID,
  name: "Planner Agent",
  model: model.lzmodel4oMini,
  requestContextSchema: plannerRequestContextSchema,
  instructions: [
    "You are the planning agent for CloudOS app builds.",
    "Always inspect existing desktop and canvas state before proposing changes.",
    "Return a compact execution plan with explicit steps and expected outputs.",
    "Avoid destructive operations unless explicitly asked.",
  ].join("\n"),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
  },
})

