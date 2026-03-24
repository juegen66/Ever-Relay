import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { discoverOfflineTaskStep } from "@/server/mastra/inngest/functions/offline-proactive/discover.function"
import { executeOfflineTargetAgentStep } from "@/server/mastra/inngest/functions/offline-proactive/execute.function"
import { logOfflineAgentActivityStep } from "@/server/mastra/inngest/functions/offline-proactive/log-activity.function"
import { offlineProactiveWorkflowOutputSchema } from "@/server/mastra/inngest/functions/offline-proactive/schemas"
import { OFFLINE_PROACTIVE_WORKFLOW_ID } from "@/server/mastra/offline/constants"
import { offlineProactiveWorkflowInputSchema } from "@/shared/contracts/offline-proactive"

const { createWorkflow } = init(inngest)

export const offlineProactiveWorkflow = createWorkflow({
  id: OFFLINE_PROACTIVE_WORKFLOW_ID,
  description:
    "Offline proactive workflow: discovery -> dynamic agent execution -> activity logging",
  inputSchema: offlineProactiveWorkflowInputSchema,
  outputSchema: offlineProactiveWorkflowOutputSchema,
  concurrency: {
    limit: 1,
    key: "event.data.userId",
  },
})
  .then(discoverOfflineTaskStep)
  .then(executeOfflineTargetAgentStep)
  .then(logOfflineAgentActivityStep)
  .commit()
