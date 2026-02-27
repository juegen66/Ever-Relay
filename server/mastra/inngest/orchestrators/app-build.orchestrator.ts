import { init } from "@mastra/inngest"
import { inngest } from "@/server/mastra/inngest/client"
import { generateBuildStep } from "@/server/mastra/inngest/functions/app-build/generate.function"
import { planBuildStep } from "@/server/mastra/inngest/functions/app-build/plan.function"
import {
  buildValidateOutputSchema,
  buildWorkflowInputSchema,
} from "@/server/mastra/inngest/functions/app-build/schemas"
import { validateBuildStep } from "@/server/mastra/inngest/functions/app-build/validate.function"

const { createWorkflow } = init(inngest)

export const APP_BUILD_WORKFLOW_ID = "app-build"

export const appBuildWorkflow = createWorkflow({
  id: APP_BUILD_WORKFLOW_ID,
  description: "CloudOS app build workflow: plan -> generate -> validate",
  inputSchema: buildWorkflowInputSchema,
  outputSchema: buildValidateOutputSchema,
  concurrency: {
    limit: 2,
    key: "event.data.userId",
  },
})
  .then(planBuildStep)
  .then(generateBuildStep)
  .then(validateBuildStep)
  .commit()

