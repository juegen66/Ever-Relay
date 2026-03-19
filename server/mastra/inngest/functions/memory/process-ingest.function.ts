import { createStep } from "@mastra/inngest"

import { afsIngestService } from "@/server/modules/afs/afs-ingest.service"

import {
  afsMemoryIngestWorkflowInputSchema,
  afsMemoryIngestWorkflowOutputSchema,
} from "./schemas"

export const processAfsMemoryIngestStep = createStep({
  id: "afs_memory_ingest_process",
  description: "Summarize new history into memory and refresh embeddings",
  inputSchema: afsMemoryIngestWorkflowInputSchema,
  outputSchema: afsMemoryIngestWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    return afsIngestService.ingestUserHistory(inputData.userId)
  },
})
