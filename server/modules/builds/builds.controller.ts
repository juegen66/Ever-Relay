import { randomUUID } from "node:crypto"
import type { Context } from "hono"
import type { BuildRunIdParams, CreateBuildParams } from "@/shared/contracts/builds"
import { APP_BUILD_REQUESTED_EVENT } from "@/server/mastra/inngest/events"
import { inngest } from "@/server/mastra/inngest/client"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { appBuildWorkflow } from "@/server/mastra/inngest/orchestrators/app-build.orchestrator"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { buildsService } from "./builds.service"

const USER_BUILD_CONCURRENCY_LIMIT = 2
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 6
const userBuildTriggerHistory = new Map<string, number[]>()

interface StartAsyncCapableRun {
  startAsync: (args: {
    inputData: {
      runId: string
      userId: string
      prompt: string
      projectId?: string | null
    }
    requestContext: ReturnType<typeof createBuildRunRequestContext>
  }) => Promise<{ runId: string }>
}

function isBuildRateLimited(userId: string, now = Date.now()) {
  const history = userBuildTriggerHistory.get(userId) ?? []
  const recent = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    userBuildTriggerHistory.set(userId, recent)
    return true
  }

  recent.push(now)
  userBuildTriggerHistory.set(userId, recent)
  return false
}

export async function triggerBuild(
  context: Context<ServerBindings>,
  body: CreateBuildParams
) {
  const userId = requireUserId(context)
  if (isBuildRateLimited(userId)) {
    return fail(context, 429, "Too many build requests. Please retry in a minute.")
  }

  const activeRuns = await buildsService.countActiveRunsByUser(userId)

  if (activeRuns >= USER_BUILD_CONCURRENCY_LIMIT) {
    return fail(
      context,
      429,
      `Build concurrency limit reached (${USER_BUILD_CONCURRENCY_LIMIT})`
    )
  }

  const runId = randomUUID()
  const projectId = body.projectId ?? null
  const prompt = body.prompt.trim()

  await buildsService.createRun({
    id: runId,
    userId,
    prompt,
    projectId,
  })

  try {
    await inngest.send({
      name: APP_BUILD_REQUESTED_EVENT,
      data: {
        runId,
        userId,
        prompt,
        projectId,
      },
    })

    const run = await appBuildWorkflow.createRun({
      runId,
      resourceId: userId,
    })

    const requestContext = createBuildRunRequestContext({
      userId,
      runId,
      projectId,
    })

    await (run as unknown as StartAsyncCapableRun).startAsync({
      inputData: {
        runId,
        userId,
        prompt,
        projectId,
      },
      requestContext,
    })
  } catch (error) {
    await buildsService.markFailed(
      runId,
      error instanceof Error ? error.message : "Failed to start build workflow"
    )
    throw error
  }

  return ok(context, {
    runId,
    stage: "queued" as const,
    status: "running" as const,
  })
}

export async function getBuildStatus(
  context: Context<ServerBindings>,
  params: BuildRunIdParams
) {
  const userId = requireUserId(context)

  const run = await buildsService.getRunByIdForUser(params.id, userId)
  if (!run) {
    return fail(context, 404, "Build run not found")
  }

  return ok(context, run)
}
