import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import {
  afsMemoryIngestSchedulerInputSchema,
  afsMemoryIngestSchedulerOutputSchema,
  scheduleAfsMemoryIngestUsersStep,
} from "@/server/mastra/inngest/functions/memory/schedule-users.function"

const { createWorkflow } = init(inngest)

export const AFS_MEMORY_INGEST_SCHEDULER_WORKFLOW_ID = "afs-memory-ingest-scheduler"

export const afsMemoryIngestSchedulerWorkflow = createWorkflow({
  id: AFS_MEMORY_INGEST_SCHEDULER_WORKFLOW_ID,
  description: "Daily AFS ingest scheduler: discover active users and queue per-user ingest workflows",
  inputSchema: afsMemoryIngestSchedulerInputSchema,
  outputSchema: afsMemoryIngestSchedulerOutputSchema,
  cron: "0 4 * * *",
})
  .then(scheduleAfsMemoryIngestUsersStep)
  .commit()
