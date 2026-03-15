import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { ingestCodingReportStep } from "@/server/mastra/inngest/functions/coding-agent/report-ingest.function"
import { executeCodingSandboxStep } from "@/server/mastra/inngest/functions/coding-agent/sandbox-execute.function"
import {
  codingValidateOutputSchema,
  codingWorkflowInputSchema,
} from "@/server/mastra/inngest/functions/coding-agent/schemas"
import { validateCodingRunStep } from "@/server/mastra/inngest/functions/coding-agent/validate.function"
import { distillMemoryStep } from "@/server/mastra/inngest/functions/memory/distill.function"

const { createWorkflow } = init(inngest)

export const CODING_AGENT_WORKFLOW_ID = "coding-agent"

export const codingAgentWorkflow = createWorkflow({
  id: CODING_AGENT_WORKFLOW_ID,
  description: "CloudOS coding workflow: report ingest -> sandbox execute -> validate -> distill memory",
  inputSchema: codingWorkflowInputSchema,
  outputSchema: codingValidateOutputSchema,
  concurrency: {
    limit: 2,
    key: "event.data.userId",
  },
})
  .then(ingestCodingReportStep)
  .then(executeCodingSandboxStep)
  .then(validateCodingRunStep)
  .then(distillMemoryStep)
  .commit()
