import { createStep } from "@mastra/inngest"

import {
  OFFLINE_ACTIVITY_SOURCE,
  OFFLINE_ACTIVITY_TYPE,
  OFFLINE_DISCOVERY_AGENT_ID,
} from "@/server/mastra/offline/constants"
import { agentActivityService } from "@/server/modules/agent-activity/agent-activity.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"

import {
  offlineProactiveLoopStepSchema,
  offlineProactiveWorkflowOutputSchema,
  offlineProactiveWorkflowStateSchema,
} from "./schemas"

function uniqNonEmptyStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))]
}

function buildLegacyTask(plan: { tasks: Array<{ name: string; description: string }> }) {
  if (plan.tasks.length === 0) {
    return "Skip this run."
  }

  if (plan.tasks.length === 1) {
    return plan.tasks[0]?.description.trim() || plan.tasks[0]?.name.trim() || "Offline proactive task"
  }

  return `Offline proactive plan: ${plan.tasks.map((task) => task.name.trim()).filter(Boolean).join(", ")}`
}

function buildLegacyTargetAgentId(
  plan: { tasks: Array<{ agentId?: unknown }> },
  reports: Array<{ agentId: string }>
) {
  const uniqueAgentIds = uniqNonEmptyStrings([
    ...plan.tasks.map((task) =>
      typeof task.agentId === "string" ? task.agentId : ""
    ),
    ...reports.map((report) => report.agentId),
  ])

  return uniqueAgentIds.length === 1 ? uniqueAgentIds[0] : ""
}

function buildLegacyExecution(
  plan: { tasks: Array<{ agentId?: unknown }> },
  reports: Array<{
    status: "completed" | "skipped" | "failed"
    summary: string
    agentId: string
    artifact?: {
      id?: string | null
      name?: string | null
      type?: string | null
      href?: string | null
    } | null
    sourceFingerprint?: string | null
  }>,
  completedTaskIds: string[],
  synthesis: string
) {
  const targetAgentId = buildLegacyTargetAgentId(plan, reports)
  const artifactReports = reports.filter((report) => report.artifact)
  const sourceFingerprintReports = reports.filter(
    (report) => typeof report.sourceFingerprint === "string" && report.sourceFingerprint
  )
  const agentIds = uniqNonEmptyStrings(reports.map((report) => report.agentId))

  return {
    status:
      plan.tasks.length === 0
        ? "skipped"
        : completedTaskIds.length >= plan.tasks.length &&
            reports.length >= plan.tasks.length &&
            reports.every((report) => report.status === "completed")
          ? "completed"
          : "failed",
    summary: synthesis,
    artifact: artifactReports.length === 1 ? artifactReports[0]?.artifact ?? null : null,
    sourceFingerprint:
      sourceFingerprintReports.length === 1
        ? sourceFingerprintReports[0]?.sourceFingerprint ?? null
        : null,
    agentId:
      agentIds.length === 1
        ? agentIds[0]
        : targetAgentId || OFFLINE_DISCOVERY_AGENT_ID,
  } as const
}

export const logOfflineAgentActivityStep = createStep({
  id: "offline_proactive_log_activity",
  description:
    "Write an Agent Activity feed entry describing the offline proactive plan and task reports.",
  inputSchema: offlineProactiveLoopStepSchema,
  outputSchema: offlineProactiveWorkflowOutputSchema,
  stateSchema: offlineProactiveWorkflowStateSchema,
  execute: async ({ inputData, state, requestContext }) => {
    const plan = state.plan ?? inputData.plan
    const reports = state.allReports
    const completedTaskIds = state.completedTaskIds
    const task = buildLegacyTask(plan)
    const targetAgentId = buildLegacyTargetAgentId(plan, reports)
    const execution = buildLegacyExecution(
      plan,
      reports,
      completedTaskIds,
      inputData.synthesis
    )
    const activityAgentId = execution.agentId || targetAgentId || OFFLINE_DISCOVERY_AGENT_ID

    const registration =
      (await agentRegistryService.getRegistration(activityAgentId)) ??
      (await agentRegistryService.getRegistration(OFFLINE_DISCOVERY_AGENT_ID))

    const runIdRaw = requestContext?.get("runId")
    const runId = typeof runIdRaw === "string" && runIdRaw.trim() ? runIdRaw : null
    const title = task.trim() || "Offline proactive review completed"

    const activity = await agentActivityService.createActivity({
      userId: inputData.userId,
      agentId: registration?.agentId ?? OFFLINE_DISCOVERY_AGENT_ID,
      activityType: OFFLINE_ACTIVITY_TYPE,
      title,
      summary: execution.summary,
      runId,
      payload: {
        source: OFFLINE_ACTIVITY_SOURCE,
        status: execution.status,
        task,
        background: inputData.synthesis,
        targetAgentId: targetAgentId || null,
        agentName: registration?.name ?? activityAgentId,
        artifact: execution.artifact ?? null,
        sourceFingerprint: execution.sourceFingerprint ?? null,
        forceRun: inputData.forceRun === true,
        plan,
        completedTaskIds,
        reports,
        synthesis: inputData.synthesis,
      },
    })

    return {
      userId: inputData.userId,
      forceRun: inputData.forceRun,
      background: inputData.synthesis,
      task,
      targetAgentId,
      execution,
      activityId: activity.id,
    }
  },
})
