import { Agent } from "@mastra/core/agent"
import { z } from "zod"
import model from "@/server/mastra/model"
import { createBuildWorkspace } from "@/server/mastra/workspace"
import {
  createCanvasProjectTool,
  createDesktopItemTool,
  deleteDesktopItemTool,
  executeSandboxCommandTool,
  listCanvasProjectsTool,
  listDesktopItemsTool,
  updateCanvasProjectTool,
  updateFileContentTool,
} from "@/server/mastra/tools"

export const BUILDER_AGENT_ID = "builder_agent"

const builderRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const builderAgent = new Agent({
  id: BUILDER_AGENT_ID,
  name: "Builder Agent",
  model: model.lzmodel4oMini,
  requestContextSchema: builderRequestContextSchema,
  workspace: ({ requestContext }) => {
    const userId = String(requestContext.get("userId") ?? "")
    const runId = String(requestContext.get("runId") ?? "")
    const rawProjectId = requestContext.get("projectId")
    const projectId = typeof rawProjectId === "string" ? rawProjectId : null

    return createBuildWorkspace({
      userId,
      runId: runId || undefined,
      projectId,
    })
  },
  instructions: [
    "You are the implementation agent for CloudOS app builds.",
    "Execute plans with deterministic, incremental edits.",
    "Use sandbox command execution for build/test validation when useful.",
    "Do not perform destructive operations unless approved=true is explicitly provided.",
  ].join("\n"),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
    createDesktopItem: createDesktopItemTool,
    updateFileContent: updateFileContentTool,
    deleteDesktopItem: deleteDesktopItemTool,
    createCanvasProject: createCanvasProjectTool,
    updateCanvasProject: updateCanvasProjectTool,
    executeSandboxCommand: executeSandboxCommandTool,
  },
})

