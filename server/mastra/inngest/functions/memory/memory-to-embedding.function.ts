import { createStep } from "@mastra/inngest"

import { afsIngestService } from "@/server/modules/afs/afs-ingest.service"

import {
  afsMemoryHistoryToMemoryOutputSchema,
  afsMemoryIngestWorkflowOutputSchema,
} from "./schemas"

export const memoryToEmbeddingStep = createStep({
  id: "afs_memory_memory_to_embedding",
  description: "Create embeddings for the memory ids produced by the history-to-memory step",
  inputSchema: afsMemoryHistoryToMemoryOutputSchema,
  outputSchema: afsMemoryIngestWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    return afsIngestService.embedChangedMemories(inputData)
  },
})
