import { RequestContext } from "@mastra/core/request-context"
import { createStep } from "@mastra/inngest"
import { z } from "zod"

import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import model from "@/server/mastra/model"
import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"
import { filesService } from "@/server/modules/files/files.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"
import { offlineExecutionResultSchema } from "@/shared/contracts/offline-proactive"

import {
  offlineProactiveLoopStepSchema,
  offlineProactivePlanSchema,
  offlineProactiveTaskReportSchema,
  offlineProactiveWorkflowStateSchema,
} from "./schemas"

type OfflineProactivePlan = z.infer<typeof offlineProactivePlanSchema>
type OfflineProactiveTask = OfflineProactivePlan["tasks"][number]
type OfflineExecutionResult = z.infer<typeof offlineExecutionResultSchema>
type WorkerToolResult = {
  toolName: string
  args: unknown
  result: unknown
}

function uniqStrings(values: string[]) {
  return [...new Set(values)]
}

function buildWorkerPrompt(task: {
  id: string
  name: string
  dependsOn: string[]
  location: string
  prerequisites: string
  description: string
  acceptanceCriteria: string[]
  validation: string
}) {
  const prerequisitesSection = task.prerequisites.trim()
    ? `## Prerequisites\n${task.prerequisites}\n\n`
    : ""
  const validationText = task.validation.trim() || "Not specified"
  const locationText = task.location.trim() || "Not specified"

  return `## Offline Proactive Workflow Context
- Task ID: ${task.id}
- Task Name: ${task.name}
- Location: ${locationText}
- Dependencies: ${task.dependsOn.join(", ") || "None"}

${prerequisitesSection}## Description
${task.description}

## Acceptance Criteria
${task.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n")}

## Validation
${validationText}

## Execution Rules
- This task is part of the offline proactive workflow.
- Stay inside the assigned task scope.
- After any tool calls, finish with a single JSON object and no markdown fences.
- Return JSON only with keys: status, summary, artifact, sourceFingerprint, agentId.
- status must be one of: completed, skipped, failed.
`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeSummary(summary: string | null | undefined, fallback: string) {
  const trimmed = summary?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function extractJsonCandidates(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const candidates = new Set<string>([trimmed])
  const fencedJsonRegex = /```(?:json)?\s*([\s\S]*?)```/gi

  for (const match of trimmed.matchAll(fencedJsonRegex)) {
    const candidate = match[1]?.trim()
    if (candidate) {
      candidates.add(candidate)
    }
  }

  const firstBraceIndex = trimmed.indexOf("{")
  const lastBraceIndex = trimmed.lastIndexOf("}")
  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    candidates.add(trimmed.slice(firstBraceIndex, lastBraceIndex + 1))
  }

  return [...candidates]
}

function tryParseExecutionResultFromText(
  text: string,
  fallbackAgentId: string
): OfflineExecutionResult | null {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed = JSON.parse(candidate)
      if (!isRecord(parsed)) {
        continue
      }

      const result = offlineExecutionResultSchema.safeParse({
        ...parsed,
        agentId:
          typeof parsed.agentId === "string" && parsed.agentId.trim()
            ? parsed.agentId
            : fallbackAgentId,
      })

      if (result.success) {
        return result.data
      }
    } catch {
      continue
    }
  }

  return null
}

function getWorkerToolResults(response: unknown): WorkerToolResult[] {
  if (!isRecord(response) || !Array.isArray(response.toolResults)) {
    return []
  }

  return response.toolResults
    .map((entry) => {
      if (!isRecord(entry) || typeof entry.toolName !== "string") {
        return null
      }

      return {
        toolName: entry.toolName,
        args: entry.args,
        result: entry.result,
      }
    })
    .filter((entry): entry is WorkerToolResult => entry !== null)
}

function normalizeContentForComparison(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim()
}

function getTextEditSourceContent(toolResults: WorkerToolResult[]) {
  const readResult = toolResults.find(
    (toolResult) => toolResult.toolName === "readDesktopFile"
  )?.result

  if (!isRecord(readResult) || readResult.ok !== true || !isRecord(readResult.file)) {
    return null
  }

  return typeof readResult.file.content === "string" ? readResult.file.content : null
}

function getTextEditCreateCall(toolResults: WorkerToolResult[]) {
  const createCall = toolResults.find(
    (toolResult) => toolResult.toolName === "createDesktopItem"
  )

  if (!createCall || !isRecord(createCall.args) || !isRecord(createCall.result)) {
    return null
  }

  const createdContent =
    typeof createCall.args.content === "string" ? createCall.args.content : null
  const created = createCall.result.created === true
  const alreadyExists = createCall.result.alreadyExists === true
  const item = isRecord(createCall.result.item) ? createCall.result.item : null
  const artifact = item
    ? {
        id: typeof item.id === "string" ? item.id : null,
        name: typeof item.name === "string" ? item.name : null,
        type: typeof item.itemType === "string" ? item.itemType : null,
        href: null,
      }
    : null

  return {
    createdContent,
    created,
    alreadyExists,
    artifact,
  }
}

function extractSourceFingerprint(
  task: OfflineProactiveTask,
  toolResults: WorkerToolResult[]
) {
  const readResult = toolResults.find(
    (toolResult) => toolResult.toolName === "readDesktopFile"
  )?.result

  if (isRecord(readResult) && readResult.ok === true && isRecord(readResult.file)) {
    const version = readResult.file.contentVersion
    if (typeof version === "number" && Number.isFinite(version)) {
      return `v${version}`
    }
  }

  const taskVersionMatch = task.prerequisites.match(/source content version=(\d+)/i)
  if (!taskVersionMatch) {
    return null
  }

  const version = Number(taskVersionMatch[1])
  return Number.isFinite(version) ? `v${version}` : null
}

function fallbackTextEditExecutionResult(
  task: OfflineProactiveTask,
  response: unknown,
  fallbackAgentId: string,
  structuredOutputError: unknown
): OfflineExecutionResult {
  const text = isRecord(response) && typeof response.text === "string"
    ? response.text.trim()
    : ""
  const toolResults = getWorkerToolResults(response)
  const fallbackFromText = tryParseExecutionResultFromText(text, fallbackAgentId)

  if (fallbackFromText) {
    return fallbackFromText
  }

  const createResult = toolResults.find(
    (toolResult) => toolResult.toolName === "createDesktopItem"
  )?.result

  if (isRecord(createResult) && createResult.ok === true && isRecord(createResult.item)) {
    const item = createResult.item
    const artifact = {
      id: typeof item.id === "string" ? item.id : null,
      name: typeof item.name === "string" ? item.name : null,
      type: typeof item.itemType === "string" ? item.itemType : null,
      href: null,
    }

    return offlineExecutionResultSchema.parse({
      status: "completed",
      summary: normalizeSummary(
        text,
        `Created candidate draft "${artifact.name ?? "Untitled"}".`
      ),
      artifact,
      sourceFingerprint: extractSourceFingerprint(task, toolResults),
      agentId: fallbackAgentId,
    })
  }

  const readResult = toolResults.find(
    (toolResult) => toolResult.toolName === "readDesktopFile"
  )?.result

  if (isRecord(readResult) && readResult.ok === false) {
    const readError =
      typeof readResult.error === "string" && readResult.error.trim()
        ? readResult.error.trim()
        : "Source file missing or unreadable."

    return offlineExecutionResultSchema.parse({
      status: "skipped",
      summary: normalizeSummary(text, readError),
      artifact: null,
      sourceFingerprint: extractSourceFingerprint(task, toolResults),
      agentId: fallbackAgentId,
    })
  }

  const lowerText = text.toLowerCase()
  if (
    text &&
    (lowerText.includes("skip") ||
      lowerText.includes("not actionable") ||
      lowerText.includes("source file missing"))
  ) {
    return offlineExecutionResultSchema.parse({
      status: "skipped",
      summary: text,
      artifact: null,
      sourceFingerprint: extractSourceFingerprint(task, toolResults),
      agentId: fallbackAgentId,
    })
  }

  const structuredMessage =
    structuredOutputError instanceof Error && structuredOutputError.message.trim()
      ? structuredOutputError.message.trim()
      : "Target agent returned a malformed JSON response."

  return offlineExecutionResultSchema.parse({
    status: "failed",
    summary: normalizeSummary(text, structuredMessage),
    artifact: null,
    sourceFingerprint: extractSourceFingerprint(task, toolResults),
    agentId: fallbackAgentId,
  })
}

function finalizeExecutionResult(
  task: OfflineProactiveTask,
  response: unknown,
  fallbackAgentId: string
): OfflineExecutionResult {
  try {
    if (isRecord(response) && "object" in response) {
      const parsed = offlineExecutionResultSchema.parse(response.object)
      return {
        ...parsed,
        agentId: parsed.agentId ?? fallbackAgentId,
      }
    }
  } catch (error) {
    if (fallbackAgentId === TEXTEDIT_PROACTIVE_AGENT_ID) {
      return fallbackTextEditExecutionResult(task, response, fallbackAgentId, error)
    }

    const text = isRecord(response) && typeof response.text === "string"
      ? response.text.trim()
      : ""
    const fallbackFromText = tryParseExecutionResultFromText(text, fallbackAgentId)

    if (fallbackFromText) {
      return fallbackFromText
    }

    return offlineExecutionResultSchema.parse({
      status: "failed",
      summary: normalizeSummary(
        text,
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Target agent returned a malformed JSON response."
      ),
      artifact: null,
      sourceFingerprint: null,
      agentId: fallbackAgentId,
    })
  }

  return offlineExecutionResultSchema.parse({
    status: "failed",
    summary: "Target agent response did not include a structured result.",
    artifact: null,
    sourceFingerprint: null,
    agentId: fallbackAgentId,
  })
}

async function validateTextEditExecutionResult(
  task: OfflineProactiveTask,
  response: unknown,
  executionResult: OfflineExecutionResult,
  userId: string
): Promise<OfflineExecutionResult> {
  const toolResults = getWorkerToolResults(response)
  const sourceContent = getTextEditSourceContent(toolResults)
  const createCall = getTextEditCreateCall(toolResults)

  if (!sourceContent || !createCall?.createdContent) {
    return executionResult
  }

  const normalizedSourceContent = normalizeContentForComparison(sourceContent)
  const normalizedCreatedContent = normalizeContentForComparison(
    createCall.createdContent
  )

  if (!normalizedSourceContent || normalizedSourceContent !== normalizedCreatedContent) {
    return executionResult
  }

  const duplicateSummary =
    "Candidate draft content matched the source file, so the no-op duplicate was rejected."

  if (createCall.created && createCall.artifact?.id) {
    const deleted = await filesService.deleteItem(createCall.artifact.id, userId)

    if (!deleted) {
      return offlineExecutionResultSchema.parse({
        status: "failed",
        summary:
          "Candidate draft content matched the source file, but the duplicate artifact could not be rolled back automatically.",
        artifact: createCall.artifact,
        sourceFingerprint:
          executionResult.sourceFingerprint ??
          extractSourceFingerprint(task, toolResults),
        agentId: executionResult.agentId,
      })
    }
  }

  return offlineExecutionResultSchema.parse({
    status: "skipped",
    summary: duplicateSummary,
    artifact: null,
    sourceFingerprint:
      executionResult.sourceFingerprint ?? extractSourceFingerprint(task, toolResults),
    agentId: executionResult.agentId,
  })
}

function buildSynthesis(
  plan: OfflineProactivePlan,
  completedTaskIds: string[],
  reports: Array<{
    taskId: string
    status: "completed" | "skipped" | "failed"
    summary: string
  }>
) {
  const total = plan.tasks.length
  const completed = completedTaskIds.length

  if (total === 0) {
    return "No actionable offline proactive tasks were planned."
  }

  if (completed >= total) {
    return `Completed ${total}/${total} offline proactive tasks. ${reports.map((report) => `[${report.taskId}] ${report.summary}`).join(" ")}`
  }

  const incompleteReports = reports.filter(
    (report) => report.status !== "completed"
  )
  const parts = [`Completed ${completed}/${total} offline proactive tasks.`]

  if (incompleteReports.length > 0) {
    parts.push(
      `Non-complete tasks: ${incompleteReports.map((report) => `[${report.taskId}] ${report.status}: ${report.summary}`).join(" ")}`
    )
  }

  return parts.join(" ")
}

function getExecutableTasks(
  plan: OfflineProactivePlan,
  completedTaskIds: string[]
): OfflineProactiveTask[] {
  return plan.tasks.filter(
    (task) =>
      !completedTaskIds.includes(task.id) &&
      task.dependsOn.every((dependencyId) => completedTaskIds.includes(dependencyId))
  )
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

export const executeOfflineProactiveWaveStep = createStep({
  id: "offline_proactive_execute_wave",
  description:
    "Execute every unblocked offline proactive task in parallel and aggregate worker reports.",
  inputSchema: offlineProactiveLoopStepSchema,
  outputSchema: offlineProactiveLoopStepSchema,
  stateSchema: offlineProactiveWorkflowStateSchema,
  execute: async ({
    inputData,
    state,
    setState,
    mastra,
    requestContext,
  }) => {
    const plan = offlineProactivePlanSchema.parse(state.plan ?? inputData.plan)
    const completedTaskIds = state.completedTaskIds
    const allReports = state.allReports

    if (inputData.done || plan.tasks.length === 0) {
      return {
        userId: inputData.userId,
        forceRun: inputData.forceRun,
        done: true,
        synthesis: inputData.synthesis,
        plan,
      }
    }

    const normalizedRequestContext = normalizeRequestContext(requestContext, {
      userId: inputData.userId,
    })

    const unblockedTasks = getExecutableTasks(plan, completedTaskIds)
    if (unblockedTasks.length === 0) {
      return {
        userId: inputData.userId,
        forceRun: inputData.forceRun,
        done: true,
        synthesis: buildSynthesis(plan, completedTaskIds, allReports),
        plan,
      }
    }

    const reports = await Promise.all(
      unblockedTasks.map(async (task) => {
        const desiredAgentId = task.agentId.trim() || TEXTEDIT_PROACTIVE_AGENT_ID
        const registration =
          (await agentRegistryService.getRunnableRegistration(desiredAgentId)) ??
          (desiredAgentId === TEXTEDIT_PROACTIVE_AGENT_ID
            ? null
            : await agentRegistryService.getRunnableRegistration(
                TEXTEDIT_PROACTIVE_AGENT_ID
              ))

        if (!registration) {
          return offlineProactiveTaskReportSchema.parse({
            taskId: task.id,
            taskName: task.name,
            agentId: desiredAgentId,
            status: "failed",
            summary: `Target agent "${desiredAgentId}" is not registered as a runnable offline agent.`,
            artifact: null,
            sourceFingerprint: null,
          })
        }

        const runtimeAgentId = agentRegistryService.resolveRuntimeAgentId(registration)
        const agent = mastra?.getAgent(runtimeAgentId)

        if (!agent) {
          return offlineProactiveTaskReportSchema.parse({
            taskId: task.id,
            taskName: task.name,
            agentId: registration.agentId,
            status: "failed",
            summary: `Target agent "${runtimeAgentId}" could not be loaded from the Mastra runtime.`,
            artifact: null,
            sourceFingerprint: null,
          })
        }

        try {
          const response = await agent.generate(buildWorkerPrompt(task), {
            requestContext: normalizedRequestContext,
            maxSteps: 8,
            structuredOutput: {
              schema: offlineExecutionResultSchema,
              model: model.lzmodel4oMini,
              jsonPromptInjection: true,
            },
          })
          const executionResult = finalizeExecutionResult(
            task,
            response,
            registration.agentId
          )
          const validatedExecutionResult =
            registration.agentId === TEXTEDIT_PROACTIVE_AGENT_ID
              ? await validateTextEditExecutionResult(
                  task,
                  response,
                  executionResult,
                  inputData.userId
                )
              : executionResult

          return offlineProactiveTaskReportSchema.parse({
            taskId: task.id,
            taskName: task.name,
            agentId: validatedExecutionResult.agentId ?? registration.agentId,
            status: validatedExecutionResult.status,
            summary:
              validatedExecutionResult.summary.trim() ||
              `Task ${task.id} returned an empty summary.`,
            artifact: validatedExecutionResult.artifact ?? null,
            sourceFingerprint: validatedExecutionResult.sourceFingerprint ?? null,
          })
        } catch (error) {
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : "Target agent execution failed."

          return offlineProactiveTaskReportSchema.parse({
            taskId: task.id,
            taskName: task.name,
            agentId: registration.agentId,
            status: "failed",
            summary: message,
            artifact: null,
            sourceFingerprint: null,
          })
        }
      })
    )

    const newCompletedTaskIds = reports
      .filter((report) => report.status === "completed")
      .map((report) => report.taskId)
    const updatedCompletedTaskIds = uniqStrings([
      ...completedTaskIds,
      ...newCompletedTaskIds,
    ])
    const updatedReports = [...allReports, ...reports]
    const allDone = updatedCompletedTaskIds.length >= plan.tasks.length
    const hasIssues = reports.some((report) => report.status !== "completed")
    const madeProgress = newCompletedTaskIds.length > 0
    const done = allDone || hasIssues || !madeProgress

    await setState({
      plan,
      completedTaskIds: updatedCompletedTaskIds,
      allReports: updatedReports,
    })

    return {
      userId: inputData.userId,
      forceRun: inputData.forceRun,
      done,
      synthesis: buildSynthesis(plan, updatedCompletedTaskIds, updatedReports),
      plan,
    }
  },
})
