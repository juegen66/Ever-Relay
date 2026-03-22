import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import {
  SKILL_TEST_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import {
  runParallelWorkflow,
} from "@/server/mastra/workflows/parallel-workflow"
import {
  parallelWorkflowRunResultSchema,
} from "@/server/mastra/workflows/parallel-workflow/types"

export const runParallelWorkflowTool = createTool({
  id: "run_parallel_workflow",
  description:
    "Route a complex, multi-step diagnostic request through the internal parallel workflow. Use this for tasks that need decomposition, dependency-aware execution, and a synthesized result.",
  inputSchema: z.object({
    request: z.string().trim().min(1),
  }),
  outputSchema: parallelWorkflowRunResultSchema,
  execute: async ({ request }, context) => {
    if (!context?.mastra) {
      throw new Error("Mastra runtime is required to run the parallel workflow")
    }

    return runParallelWorkflow({
      mastra: context.mastra,
      request,
      sourceAgentId: SKILL_TEST_AGENT_ID,
      requestContext: context.requestContext,
    })
  },
})
