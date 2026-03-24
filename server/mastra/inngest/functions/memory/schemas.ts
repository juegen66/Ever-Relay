import { z } from "zod"

export const afsMemoryIngestWorkflowInputSchema = z.object({
  userId: z.string().min(1),
})

export const afsMemoryHistoryToMemoryOutputSchema = z.object({
  userId: z.string().min(1),
  historyCount: z.number().int().nonnegative(),
  memoriesWritten: z.number().int().nonnegative(),
  noteMemories: z.number().int().nonnegative(),
  userMemories: z.number().int().nonnegative(),
  batchesProcessed: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  checkpoint: z.object({
    lastHistoryId: z.string().nullable(),
    lastHistoryCreatedAt: z.string().nullable(),
  }),
  changedMemoryIds: z.array(z.string().uuid()),
})

export const afsMemoryIngestWorkflowOutputSchema = afsMemoryHistoryToMemoryOutputSchema
  .omit({
    changedMemoryIds: true,
  })
  .extend({
    embeddingsUpdated: z.number().int().nonnegative(),
})

export type AfsMemoryHistoryToMemoryOutput = z.infer<typeof afsMemoryHistoryToMemoryOutputSchema>
export type AfsMemoryIngestWorkflowOutput = z.infer<typeof afsMemoryIngestWorkflowOutputSchema>
