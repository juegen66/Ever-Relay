import { createStep } from "@mastra/inngest"

import {
  OFFLINE_ACTIVITY_SOURCE,
  OFFLINE_ACTIVITY_TYPE,
  OFFLINE_DISCOVERY_AGENT_ID,
} from "@/server/mastra/offline/constants"
import { agentActivityService } from "@/server/modules/agent-activity/agent-activity.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"

import {
  offlineProactiveExecutionStepOutputSchema,
  offlineProactiveWorkflowOutputSchema,
} from "./schemas"

export const logOfflineAgentActivityStep = createStep({
  id: "offline_proactive_log_activity",
  description:
    "Write an Agent Activity feed entry describing what the offline workflow did.",
  inputSchema: offlineProactiveExecutionStepOutputSchema,
  outputSchema: offlineProactiveWorkflowOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    const activityAgentId =
      inputData.execution.agentId?.trim() ||
      inputData.targetAgentId.trim() ||
      OFFLINE_DISCOVERY_AGENT_ID

    const registration =
      (await agentRegistryService.getRegistration(activityAgentId)) ??
      (await agentRegistryService.getRegistration(OFFLINE_DISCOVERY_AGENT_ID))

    const runIdRaw = requestContext?.get("runId")
    const runId = typeof runIdRaw === "string" && runIdRaw.trim() ? runIdRaw : null
    const title =
      inputData.task.trim() || "Offline proactive review completed"

    const activity = await agentActivityService.createActivity({
      userId: inputData.userId,
      agentId: registration?.agentId ?? OFFLINE_DISCOVERY_AGENT_ID,
      activityType: OFFLINE_ACTIVITY_TYPE,
      title,
      summary: inputData.execution.summary,
      runId,
      payload: {
        source: OFFLINE_ACTIVITY_SOURCE,
        status: inputData.execution.status,
        task: inputData.task,
        background: inputData.background,
        targetAgentId: inputData.targetAgentId || null,
        agentName: registration?.name ?? activityAgentId,
        artifact: inputData.execution.artifact ?? null,
        sourceFingerprint: inputData.execution.sourceFingerprint ?? null,
      },
    })

    return {
      ...inputData,
      activityId: activity.id,
    }
  },
})
