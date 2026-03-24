import { randomUUID } from "node:crypto"

import { createStep } from "@mastra/inngest"
import { z } from "zod"

import { afsMemoryIngestWorkflow } from "@/server/mastra/inngest/orchestrators/afs-memory-ingest.orchestrator"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { afsIngestService } from "@/server/modules/afs/afs-ingest.service"

export const afsMemoryIngestSchedulerInputSchema = z.object({
  userId: z.string().min(1).optional(),
  limit: z.number().int().positive().max(200).optional(),
})

export const afsMemoryIngestSchedulerOutputSchema = z.object({
  queuedUsers: z.number().int().nonnegative(),
  queuedUserIds: z.array(z.string().min(1)),
  failedUsers: z.array(z.object({
    userId: z.string().min(1),
    error: z.string().min(1),
  })),
})

interface StartAsyncCapableRun {
  startAsync: (args: {
    inputData: {
      userId: string
    }
    requestContext: ReturnType<typeof createBuildRunRequestContext>
  }) => Promise<{ runId: string }>
}

export const scheduleAfsMemoryIngestUsersStep = createStep({
  id: "afs_memory_ingest_schedule_users",
  description: "Queue one AFS memory ingest workflow run per active user",
  inputSchema: afsMemoryIngestSchedulerInputSchema,
  outputSchema: afsMemoryIngestSchedulerOutputSchema,
  execute: async ({ inputData }) => {
    const explicitUserId = inputData.userId?.trim()
    const userIds = explicitUserId
      ? [explicitUserId]
      : await afsIngestService.listUsersNeedingIngest(inputData.limit ?? 50)

    const queuedUserIds: string[] = []
    const failedUsers: Array<{ userId: string; error: string }> = []

    for (const userId of userIds) {
      try {
        const workflowRunId = randomUUID()
        const run = await afsMemoryIngestWorkflow.createRun({
          runId: workflowRunId,
          resourceId: userId,
        })

        await (run as unknown as StartAsyncCapableRun).startAsync({
          inputData: { userId },
          requestContext: createBuildRunRequestContext({
            userId,
            runId: workflowRunId,
          }),
        })

        queuedUserIds.push(userId)
      } catch (error) {
        failedUsers.push({
          userId,
          error: error instanceof Error && error.message.trim()
            ? error.message
            : "Failed to queue AFS memory ingest workflow",
        })
      }
    }

    return {
      queuedUsers: queuedUserIds.length,
      queuedUserIds,
      failedUsers,
    }
  },
})
