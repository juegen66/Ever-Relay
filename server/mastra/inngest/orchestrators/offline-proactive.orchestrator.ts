import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { executeOfflineProactiveWaveStep } from "@/server/mastra/inngest/functions/offline-proactive/execute-wave.function"
import { gatherOfflineProactiveContextStep } from "@/server/mastra/inngest/functions/offline-proactive/gather-context.function"
import { logOfflineAgentActivityStep } from "@/server/mastra/inngest/functions/offline-proactive/log-activity.function"
import { planOfflineProactiveStep } from "@/server/mastra/inngest/functions/offline-proactive/plan.function"
import {
  offlineProactiveWorkflowOutputSchema,
  offlineProactiveWorkflowStateSchema,
} from "@/server/mastra/inngest/functions/offline-proactive/schemas"
import { OFFLINE_PROACTIVE_WORKFLOW_ID } from "@/server/mastra/offline/constants"
import { offlineProactiveWorkflowInputSchema } from "@/shared/contracts/offline-proactive"

const { createWorkflow } = init(inngest)

export const offlineProactiveWorkflow = createWorkflow({
  id: OFFLINE_PROACTIVE_WORKFLOW_ID,
  description:
    "Offline proactive workflow: gather context -> plan -> execute in parallel waves -> activity logging",
  inputSchema: offlineProactiveWorkflowInputSchema,
  outputSchema: offlineProactiveWorkflowOutputSchema,
  stateSchema: offlineProactiveWorkflowStateSchema,
  concurrency: {
    limit: 1,
    key: "event.data.userId",
  },
})
  .then(gatherOfflineProactiveContextStep)
  .then(planOfflineProactiveStep)
  .map(async ({ inputData }) => inputData)
  .dountil(
    executeOfflineProactiveWaveStep,
    async ({ inputData }) => inputData.done === true
  )
  .then(logOfflineAgentActivityStep)
  .commit()
