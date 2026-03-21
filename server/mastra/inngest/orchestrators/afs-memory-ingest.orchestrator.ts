import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { historyToMemoryStep } from "@/server/mastra/inngest/functions/memory/history-to-memory.function"
import { memoryToEmbeddingStep } from "@/server/mastra/inngest/functions/memory/memory-to-embedding.function"
import {
  afsMemoryIngestWorkflowInputSchema,
  afsMemoryIngestWorkflowOutputSchema,
} from "@/server/mastra/inngest/functions/memory/schemas"

const { createWorkflow } = init(inngest)

export const AFS_MEMORY_INGEST_WORKFLOW_ID = "afs-memory-ingest"

export const afsMemoryIngestWorkflow = createWorkflow({
  id: AFS_MEMORY_INGEST_WORKFLOW_ID,
  description: "Daily AFS ingest: history to memory, then memory to embeddings",
  inputSchema: afsMemoryIngestWorkflowInputSchema,
  outputSchema: afsMemoryIngestWorkflowOutputSchema,
  concurrency: {
    limit: 1,
    key: "event.data.userId",
  },
})
  .then(historyToMemoryStep)
  .then(memoryToEmbeddingStep)
  .commit()
