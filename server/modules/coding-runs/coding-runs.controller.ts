import { randomUUID } from "node:crypto"

import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import { inngest } from "@/server/mastra/inngest/client"
import { CODING_AGENT_REQUESTED_EVENT } from "@/server/mastra/inngest/events"
import { codingAgentWorkflow } from "@/server/mastra/inngest/orchestrators/coding-agent.orchestrator"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { codingAppsService } from "@/server/modules/coding-apps/coding-apps.service"
import type { ServerBindings } from "@/server/types"
import type {
  CodingRunIdParams,
  CreateCodingRunParams,
} from "@/shared/contracts/coding-runs"

import { codingRunsService } from "./coding-runs.service"

import type { Context } from "hono"

const CODING_RUN_CONCURRENCY_LIMIT = 2

interface StartAsyncCapableRun {
  startAsync: (args: {
    inputData: {
      runId: string
      userId: string
      appId: string
      report: CreateCodingRunParams["report"]
    }
    requestContext: ReturnType<typeof createBuildRunRequestContext>
  }) => Promise<{ runId: string }>
}

function getCodingRunAppId(
  run: NonNullable<Awaited<ReturnType<typeof codingRunsService.getRunById>>>
) {
  if (!run.projectId) {
    throw new Error(`Coding workflow run ${run.id} is missing appId`)
  }

  return run.projectId
}

function formatCodingRun(run: NonNullable<Awaited<ReturnType<typeof codingRunsService.getRunById>>>) {
  return {
    id: run.id,
    userId: run.userId,
    appId: getCodingRunAppId(run),
    workflowType: "coding-agent" as const,
    prompt: run.prompt,
    stage: run.stage,
    status: run.status,
    planJson: run.planJson ?? null,
    resultJson: run.resultJson ?? null,
    error: run.error ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }
}

export async function triggerCodingRun(
  context: Context<ServerBindings>,
  body: CreateCodingRunParams
) {
  const userId = requireUserId(context)
  const activeRuns = await codingRunsService.countActiveRunsByUser(userId)

  if (activeRuns >= CODING_RUN_CONCURRENCY_LIMIT) {
    return fail(
      context,
      429,
      `Coding workflow concurrency limit reached (${CODING_RUN_CONCURRENCY_LIMIT})`
    )
  }

  const runId = randomUUID()
  const appId = body.appId
  const app = await codingAppsService.getAppByIdForUser(appId, userId)

  if (!app) {
    return fail(context, 404, "Coding app not found")
  }

  await codingRunsService.createRun({
    id: runId,
    userId,
    appId: app.id,
    report: body.report,
  })

  try {
    await inngest.send({
      name: CODING_AGENT_REQUESTED_EVENT,
      data: {
        runId,
        userId,
        appId: app.id,
        report: body.report,
      },
    })

    const run = await codingAgentWorkflow.createRun({
      runId,
      resourceId: userId,
    })

    const requestContext = createBuildRunRequestContext({
      userId,
      runId,
      appId: app.id,
    })

    await (run as unknown as StartAsyncCapableRun).startAsync({
      inputData: {
        runId,
        userId,
        appId: app.id,
        report: body.report,
      },
      requestContext,
    })
  } catch (error) {
    await codingRunsService.markFailed(
      runId,
      error instanceof Error ? error.message : "Failed to start coding workflow"
    )
    throw error
  }

  return ok(context, {
    runId,
    stage: "queued" as const,
    status: "running" as const,
  })
}

export async function getCodingRun(
  context: Context<ServerBindings>,
  params: CodingRunIdParams
) {
  const userId = requireUserId(context)
  const run = await codingRunsService.getRunByIdForUser(params.id, userId)

  if (!run) {
    return fail(context, 404, "Coding workflow run not found")
  }

  return ok(context, formatCodingRun(run))
}
