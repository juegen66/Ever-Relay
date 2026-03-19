import { z } from "zod"

export const afsMemoryIngestWorkflowInputSchema = z.object({
  userId: z.string().min(1),
})

export const afsMemoryIngestWorkflowOutputSchema = z.object({
  userId: z.string().min(1),
  historyCount: z.number().int().nonnegative(),
  memoriesWritten: z.number().int().nonnegative(),
  embeddingsUpdated: z.number().int().nonnegative(),
  noteMemories: z.number().int().nonnegative(),
  userMemories: z.number().int().nonnegative(),
  batchesProcessed: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  checkpoint: z.object({
    lastHistoryId: z.string().nullable(),
    lastHistoryCreatedAt: z.string().nullable(),
  }),
})
