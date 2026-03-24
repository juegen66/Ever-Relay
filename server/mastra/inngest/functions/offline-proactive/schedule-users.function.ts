import { randomUUID } from "node:crypto"

import { createStep } from "@mastra/inngest"

import { offlineProactiveWorkflow } from "@/server/mastra/inngest/orchestrators/offline-proactive.orchestrator"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { afsIngestService } from "@/server/modules/afs/afs-ingest.service"

import {
  offlineProactiveSchedulerInputSchema,
  offlineProactiveSchedulerOutputSchema,
} from "./schemas"

interface StartAsyncCapableRun {
  startAsync: (args: {
    inputData: {
      userId: string
    }
    requestContext: ReturnType<typeof createBuildRunRequestContext>
  }) => Promise<{ runId: string }>
}

export const scheduleOfflineProactiveUsersStep = createStep({
  id: "offline_proactive_schedule_users",
  description:
    "Queue one offline proactive workflow run per eligible user.",
  inputSchema: offlineProactiveSchedulerInputSchema,
  outputSchema: offlineProactiveSchedulerOutputSchema,
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
        const run = await offlineProactiveWorkflow.createRun({
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
          error:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Failed to queue offline proactive workflow",
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
