import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { scheduleOfflineProactiveUsersStep } from "@/server/mastra/inngest/functions/offline-proactive/schedule-users.function"
import {
  offlineProactiveSchedulerInputSchema,
  offlineProactiveSchedulerOutputSchema,
} from "@/server/mastra/inngest/functions/offline-proactive/schemas"
import { OFFLINE_PROACTIVE_SCHEDULER_WORKFLOW_ID } from "@/server/mastra/offline/constants"


const { createWorkflow } = init(inngest)

export const offlineProactiveSchedulerWorkflow = createWorkflow({
  id: OFFLINE_PROACTIVE_SCHEDULER_WORKFLOW_ID,
  description:
    "Daily scheduler that discovers eligible users and queues offline proactive runs.",
  inputSchema: offlineProactiveSchedulerInputSchema,
  outputSchema: offlineProactiveSchedulerOutputSchema,
  cron: "0 2 * * *",
})
  .then(scheduleOfflineProactiveUsersStep)
  .commit()
