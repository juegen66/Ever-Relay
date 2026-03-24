import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"

export const WORKER_AGENT_ID = "workerAgent"

const workerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  sourceAgentId: z.string().optional(),
})

export const workerAgent = new Agent({
  id: WORKER_AGENT_ID,
  name: "Worker Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: workerRequestContextSchema,
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.trim()
      ? rawUserId.trim()
      : ""

    const rawSourceAgentId = requestContext.get("sourceAgentId")
    const sourceAgentId = typeof rawSourceAgentId === "string" && rawSourceAgentId.trim()
      ? rawSourceAgentId.trim()
      : undefined

    return userId
      ? [new AfsSkillProcessor({ userId, agentId: sourceAgentId })]
      : []
  },
  instructions: [
    "You execute one workflow task at a time for internal parallel workflow runs.",
    "Use the task prerequisites as the primary execution context when they are present.",
    "If relevant skills are available, activate them before following their instructions.",
    "Stay inside the assigned task scope and do not plan unrelated follow-up work.",
    "Return JSON only with keys: taskId, taskName, status, summary.",
  ].join("\n"),
})
