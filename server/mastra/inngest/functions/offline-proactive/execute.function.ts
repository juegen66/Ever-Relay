import { RequestContext } from "@mastra/core/request-context"
import { createStep } from "@mastra/inngest"

import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import model from "@/server/mastra/model"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"
import { offlineExecutionResultSchema } from "@/shared/contracts/offline-proactive"

import {
  offlineProactiveDiscoveryStepOutputSchema,
  offlineProactiveExecutionStepOutputSchema,
} from "./schemas"

function buildExecutionResult(
  status: "completed" | "skipped" | "failed",
  summary: string,
  options: {
    artifact?: {
      id?: string | null
      name?: string | null
      type?: string | null
      href?: string | null
    } | null
    sourceFingerprint?: string | null
    agentId?: string | null
  } = {}
) {
  return {
    status,
    summary,
    artifact: options.artifact ?? null,
    sourceFingerprint: options.sourceFingerprint ?? null,
    agentId: options.agentId ?? null,
  }
}

function normalizeRequestContext(
  requestContext: RequestContext<unknown> | null | undefined,
  inputData: { userId: string }
) {
  const rawUserId = requestContext?.get?.("userId")
  const rawRunId = requestContext?.get?.("runId")
  const rawProjectId = requestContext?.get?.("projectId")
  const rawAppId = requestContext?.get?.("appId")

  return createBuildRunRequestContext({
    userId:
      typeof rawUserId === "string" && rawUserId.trim()
        ? rawUserId.trim()
        : inputData.userId,
    runId: typeof rawRunId === "string" && rawRunId.trim() ? rawRunId : undefined,
    projectId: typeof rawProjectId === "string" ? rawProjectId : null,
    appId: typeof rawAppId === "string" ? rawAppId : null,
  })
}

export const executeOfflineTargetAgentStep = createStep({
  id: "offline_proactive_execute",
  description:
    "Resolve the target agent dynamically from the registry and execute the offline task.",
  inputSchema: offlineProactiveDiscoveryStepOutputSchema,
  outputSchema: offlineProactiveExecutionStepOutputSchema,
  execute: async ({ inputData, mastra, requestContext }) => {
    const emptyTask = !inputData.task.trim() || !inputData.targetAgentId.trim()
    if (emptyTask) {
      return {
        ...inputData,
        execution: buildExecutionResult(
          "skipped",
          inputData.background.trim() ||
            "Discovery did not find an offline action worth taking."
        ),
      }
    }

    const registration = await agentRegistryService.getRunnableRegistration(
      inputData.targetAgentId
    )
    if (!registration) {
      return {
        ...inputData,
        execution: buildExecutionResult(
          "failed",
          `Target agent "${inputData.targetAgentId}" is not registered as a runnable offline agent.`,
          { agentId: inputData.targetAgentId }
        ),
      }
    }

    const runtimeAgentId = agentRegistryService.resolveRuntimeAgentId(registration)
    const agent = mastra?.getAgent(runtimeAgentId)
    if (!agent) {
      return {
        ...inputData,
        execution: buildExecutionResult(
          "failed",
          `Target agent "${runtimeAgentId}" could not be loaded from the Mastra runtime.`,
          { agentId: registration.agentId }
        ),
      }
    }

    try {
      const normalizedRequestContext = normalizeRequestContext(
        requestContext,
        inputData
      )

      const response = await agent.generate(
        [
          "Execute this offline proactive task.",
          "",
          "Task:",
          inputData.task,
          "",
          "Background:",
          inputData.background,
          "",
          "Return JSON only with keys:",
          "- status: completed | skipped | failed",
          "- summary: concise summary of what happened",
          "- artifact: optional object with id, name, type, href",
          "- sourceFingerprint: optional source version fingerprint",
          "- agentId: the agent id that executed the task",
        ].join("\n"),
        {
          requestContext: normalizedRequestContext,
          maxSteps: 8,
          structuredOutput: {
            schema: offlineExecutionResultSchema,
            model: model.lzmodel4oMini,
            jsonPromptInjection: true,
          },
        }
      )

      return {
        ...inputData,
        execution: buildExecutionResult(response.object.status, response.object.summary, {
          artifact: response.object.artifact ?? null,
          sourceFingerprint: response.object.sourceFingerprint ?? null,
          agentId: response.object.agentId ?? registration.agentId,
        }),
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Target agent execution failed."

      return {
        ...inputData,
        execution: buildExecutionResult("failed", message, {
          agentId: registration.agentId,
        }),
      }
    }
  },
})
