import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
  RequestContext,
} from "@mastra/core/request-context"

import {
  classifyParallelRequest,
} from "@/server/mastra/workflows/parallel-workflow/complexity"
import {
  PARALLEL_WORKFLOW_ID,
} from "@/server/mastra/workflows/parallel-workflow/parallel-workflow"
import {
  getParallelWorkflowSourceConfig,
} from "@/server/mastra/workflows/parallel-workflow/registry"
import type {
  ParallelPlan,
  ParallelTaskReport,
  ParallelWorkflowRunResult,
} from "@/server/mastra/workflows/parallel-workflow/types"

interface RunParallelWorkflowParams {
  mastra: {
    getWorkflow: (workflowId: string) => {
      createRun: (options?: { resourceId?: string }) => Promise<{
        start: (options: {
          inputData: {
            request: string
            sourceAgentId: string
          }
          requestContext?: RequestContext
          outputOptions?: {
            includeState?: boolean
          }
        }) => Promise<{
          status: string
          result?: {
            synthesis: string
          }
          state?: {
            plan?: ParallelPlan | null
            completedTaskIds?: string[]
            allReports?: ParallelTaskReport[]
          }
          error?: Error
        }>
      }>
    }
  }
  request: string
  sourceAgentId: string
  requestContext?: RequestContext
}

function buildParallelRequestContext(
  sourceRequestContext: RequestContext | undefined,
  sourceAgentId: string,
  defaultUserId: string | undefined
) {
  const requestContext = new RequestContext()

  for (const [key, value] of sourceRequestContext?.entries() ?? []) {
    requestContext.set(key, value)
  }

  const sourceUserId = sourceRequestContext?.get("userId")
  const userId = typeof sourceUserId === "string" && sourceUserId.trim()
    ? sourceUserId.trim()
    : (defaultUserId ?? "").trim()

  if (!userId) {
    throw new Error(`Parallel workflow requires a userId for source agent ${sourceAgentId}`)
  }

  const rawRunId = sourceRequestContext?.get("runId")
  const threadId = typeof rawRunId === "string" && rawRunId.trim()
    ? rawRunId.trim()
    : userId

  requestContext.set("userId", userId)
  requestContext.set("sourceAgentId", sourceAgentId)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId)
  requestContext.set(MASTRA_THREAD_ID_KEY, threadId)

  return requestContext
}

export async function runParallelWorkflow({
  mastra,
  request,
  sourceAgentId,
  requestContext,
}: RunParallelWorkflowParams): Promise<ParallelWorkflowRunResult> {
  const config = getParallelWorkflowSourceConfig(sourceAgentId)

  if (!config) {
    return {
      accepted: false,
      routed: false,
      status: "not_routed",
      reason: `Parallel workflow is not enabled for source agent "${sourceAgentId}".`,
      synthesis: `Parallel workflow is not enabled for source agent "${sourceAgentId}".`,
      complexity: {
        isComplex: false,
        score: 0,
        reasons: ["source agent is not registered"],
      },
      plan: null,
      completedTaskIds: [],
      reports: [],
    }
  }

  const trimmedRequest = request.trim()
  const complexity = classifyParallelRequest(trimmedRequest, config)

  if (!complexity.isComplex) {
    return {
      accepted: true,
      routed: false,
      status: "not_routed",
      reason: "Request did not meet the complexity threshold for parallel workflow.",
      synthesis: "Request did not meet the complexity threshold for parallel workflow.",
      complexity,
      plan: null,
      completedTaskIds: [],
      reports: [],
    }
  }

  const normalizedRequestContext = buildParallelRequestContext(
    requestContext,
    sourceAgentId,
    config.defaultUserId
  )

  const resourceId = String(normalizedRequestContext.get(MASTRA_RESOURCE_ID_KEY))
  const workflow = mastra.getWorkflow(PARALLEL_WORKFLOW_ID)
  const run = await workflow.createRun({
    resourceId,
  })
  const result = await run.start({
    inputData: {
      request: trimmedRequest,
      sourceAgentId,
    },
    requestContext: normalizedRequestContext,
    outputOptions: {
      includeState: true,
    },
  })

  if (result.status !== "success" || !result.result) {
    const reason =
      result.status === "failed"
        ? (result.error?.message ?? "Parallel workflow failed.")
        : `Parallel workflow finished with status "${result.status}".`

    return {
      accepted: true,
      routed: true,
      status: "failed",
      reason,
      synthesis: reason,
      complexity,
      plan: result.state?.plan ?? null,
      completedTaskIds: result.state?.completedTaskIds ?? [],
      reports: result.state?.allReports ?? [],
    }
  }

  return {
    accepted: true,
    routed: true,
    status: "success",
    reason: null,
    synthesis: result.result.synthesis,
    complexity,
    plan: result.state?.plan ?? null,
    completedTaskIds: result.state?.completedTaskIds ?? [],
    reports: result.state?.allReports ?? [],
  }
}
