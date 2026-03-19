import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { processAfsMemoryIngestStep } from "@/server/mastra/inngest/functions/memory/process-ingest.function"
import {
  afsMemoryIngestWorkflowInputSchema,
  afsMemoryIngestWorkflowOutputSchema,
} from "@/server/mastra/inngest/functions/memory/schemas"

const { createWorkflow } = init(inngest)

export const AFS_MEMORY_INGEST_WORKFLOW_ID = "afs-memory-ingest"

export const afsMemoryIngestWorkflow = createWorkflow({
  id: AFS_MEMORY_INGEST_WORKFLOW_ID,
  description: "Daily AFS ingest: summarize new history into memory and sync embeddings",
  inputSchema: afsMemoryIngestWorkflowInputSchema,
  outputSchema: afsMemoryIngestWorkflowOutputSchema,
  concurrency: {
    limit: 1,
    key: "event.data.userId",
  },
})
  .then(processAfsMemoryIngestStep)
  .commit()
