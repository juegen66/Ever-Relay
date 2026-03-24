import { createStep } from "@mastra/inngest"

import { afsIngestService } from "@/server/modules/afs/afs-ingest.service"

import {
  afsMemoryHistoryToMemoryOutputSchema,
  afsMemoryIngestWorkflowInputSchema,
} from "./schemas"

export const historyToMemoryStep = createStep({
  id: "afs_memory_history_to_memory",
  description: "Distill new history into memory and return the changed memory ids",
  inputSchema: afsMemoryIngestWorkflowInputSchema,
  outputSchema: afsMemoryHistoryToMemoryOutputSchema,
  execute: async ({ inputData }) => {
    return afsIngestService.ingestHistoryToMemory(inputData.userId)
  },
})
