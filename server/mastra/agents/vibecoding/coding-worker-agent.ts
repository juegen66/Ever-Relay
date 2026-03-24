import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { executeSandboxCommandTool } from "@/server/mastra/tools"
import { createCodingWorkspace } from "@/server/mastra/workspace"

export const CODING_WORKER_AGENT_ID = "coding_worker_agent"

const codingWorkerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  appId: z.string().uuid(),
})

export const codingWorkerAgent = new Agent({
  id: CODING_WORKER_AGENT_ID,
  name: "Coding Worker Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: codingWorkerRequestContextSchema,
  workspace: ({ requestContext }) => {
    const userId = String(requestContext.get("userId") ?? "")
    const runId = String(requestContext.get("runId") ?? "")
    const rawAppId = requestContext.get("appId")
    const appId = typeof rawAppId === "string" ? rawAppId : ""

    return createCodingWorkspace({
      userId,
      appId,
      runId: runId || undefined,
    })
  },
  instructions: [
    "You execute the sandbox phase of the EverRelay coding workflow.",
    "Use execute_sandbox_command for safe read-only validation.",
    "Run at most 3 commands and prefer simple environment inspection such as pwd, ls, node --version, or pnpm --version when relevant.",
    "Return JSON only with keys: status, summary, commands, findings, nextActions.",
  ].join("\n"),
  tools: {
    executeSandboxCommand: executeSandboxCommandTool,
  },
})
