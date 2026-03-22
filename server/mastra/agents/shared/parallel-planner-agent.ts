import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import {
  PARALLEL_PLANNER_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import model from "@/server/mastra/model"

export { PARALLEL_PLANNER_AGENT_ID } from "@/server/mastra/agents/shared/parallel-agent.constants"

const parallelPlannerRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  sourceAgentId: z.string().optional(),
})

export const parallelPlannerAgent = new Agent({
  id: PARALLEL_PLANNER_AGENT_ID,
  name: "Parallel Planner Agent",
  model: model.lzmodel4oMini,
  requestContextSchema: parallelPlannerRequestContextSchema,
  instructions: [
    "You design dependency-aware execution plans for the internal parallel workflow.",
    "Prefer a compact plan with only the tasks required to fulfill the request.",
    "Respect the allowed task agent ids provided in the prompt.",
    "When a task can run independently, keep it in the same wave by avoiding unnecessary dependencies.",
    "Do not include speculative or unrelated tasks.",
  ].join("\n"),
})
