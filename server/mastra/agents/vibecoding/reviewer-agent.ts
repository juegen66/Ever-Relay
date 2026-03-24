import { Agent } from "@mastra/core/agent"
import { z } from "zod"
import model from "@/server/mastra/model"
import { createAgentMemory } from "@/server/mastra/memory"
import { createBuildWorkspace } from "@/server/mastra/workspace"
import {
  executeSandboxCommandTool,
  listCanvasProjectsTool,
  listDesktopItemsTool,
} from "@/server/mastra/tools"

export const REVIEWER_AGENT_ID = "reviewer_agent"

const reviewerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const reviewerAgent = new Agent({
  id: REVIEWER_AGENT_ID,
  name: "Reviewer Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: reviewerRequestContextSchema,
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
    "You are the quality gate for EverRelay app builds.",
    "Validate correctness, safety, and minimal regression risk.",
    "Use sandbox commands for quick checks when needed.",
    "Return clear PASS/FAIL rationale and concrete follow-up actions.",
  ].join("\n"),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
    executeSandboxCommand: executeSandboxCommandTool,
  },
})
