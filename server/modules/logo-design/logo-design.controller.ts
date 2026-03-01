import { randomUUID } from "node:crypto"
import type { Context } from "hono"
import type {
  CreateLogoDesignParams,
  LogoDesignAssetIdParams,
  LogoDesignRunIdParams,
} from "@/shared/contracts/logo-design"
import { LOGO_DESIGN_REQUESTED_EVENT } from "@/server/mastra/inngest/events"
import { inngest } from "@/server/mastra/inngest/client"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignWorkflow } from "@/server/mastra/inngest/orchestrators/logo-design.orchestrator"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { logoDesignService } from "./logo-design.service"

const LOGO_DESIGN_CONCURRENCY_LIMIT = 2
const LOGO_DESIGN_STAGE_PROGRESS: Record<string, { current: number; total: number; label: string }> = {
  queued: { current: 0, total: 5, label: "排队中..." },
  planning: { current: 1, total: 5, label: "正在分析品牌定位..." },
  brand_designing: { current: 2, total: 5, label: "正在设计 Logo 和品牌视觉..." },
  poster_designing: { current: 3, total: 5, label: "正在创作设计哲学和海报..." },
  persisting: { current: 4, total: 5, label: "正在生成资产文件..." },
  complete: { current: 5, total: 5, label: "已完成" },
  failed: { current: 0, total: 5, label: "失败" },
}

interface StartAsyncCapableRun {
  startAsync: (args: {
    inputData: {
      runId: string
      userId: string
      prompt: string
      brandBrief?: Record<string, unknown>
    }
    requestContext: ReturnType<typeof createBuildRunRequestContext>
  }) => Promise<{ runId: string }>
}

function formatRunForResponse(run: {
  id: string
  userId: string
  workflowType: string
  prompt: string
  brandBrief: unknown
  stage: string
  status: string
  planJson: unknown
  resultJson: unknown
  error: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: run.id,
    userId: run.userId,
    workflowType: run.workflowType,
    prompt: run.prompt,
    brandBrief: run.brandBrief,
    stage: run.stage,
    status: run.status,
    planJson: run.planJson,
    resultJson: run.resultJson,
    error: run.error,
    progress: LOGO_DESIGN_STAGE_PROGRESS[run.stage] ?? LOGO_DESIGN_STAGE_PROGRESS.queued,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }
}

export async function triggerLogoDesign(
  context: Context<ServerBindings>,
  body: CreateLogoDesignParams
) {
  const userId = requireUserId(context)

  const activeRuns = await logoDesignService.countActiveLogoDesignRunsByUser(userId)
  if (activeRuns >= LOGO_DESIGN_CONCURRENCY_LIMIT) {
    return fail(
      context,
      429,
      `Logo design concurrency limit reached (${LOGO_DESIGN_CONCURRENCY_LIMIT})`
    )
  }

  const runId = randomUUID()
  const prompt = body.prompt.trim()
  const brandBrief = body.brandBrief ?? undefined

  await logoDesignService.createRun({
    id: runId,
    userId,
    prompt,
    brandBrief,
  })

  try {
    await inngest.send({
      name: LOGO_DESIGN_REQUESTED_EVENT,
      data: {
        runId,
        userId,
        prompt,
        brandBrief,
      },
    })

    const run = await logoDesignWorkflow.createRun({
      runId,
      resourceId: userId,
    })

    const requestContext = createBuildRunRequestContext({
      userId,
      runId,
    })

    await (run as unknown as StartAsyncCapableRun).startAsync({
      inputData: {
        runId,
        userId,
        prompt,
        brandBrief,
      },
      requestContext,
    })
  } catch (error) {
    await logoDesignService.markFailed(
      runId,
      error instanceof Error ? error.message : "Failed to start logo design workflow"
    )
    throw error
  }

  return ok(context, {
    runId,
    stage: "queued" as const,
    status: "running" as const,
  })
}

export async function getLogoDesign(
  context: Context<ServerBindings>,
  params: LogoDesignRunIdParams
) {
  const userId = requireUserId(context)

  const run = await logoDesignService.getRunByIdForUser(params.id, userId)
  if (!run) {
    return fail(context, 404, "Logo design run not found")
  }

  const assets =
    run.status === "completed"
      ? await logoDesignService.listAssetsByRunId(run.id)
      : []

  return ok(context, {
    ...formatRunForResponse(run),
    assets: assets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      metadata: a.metadata,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}

export async function listLogoDesigns(context: Context<ServerBindings>) {
  const userId = requireUserId(context)

  const runs = await logoDesignService.listLogoDesignRunsByUser(userId)
  return ok(
    context,
    runs.map((r) => formatRunForResponse(r))
  )
}

export async function getLogoDesignAssets(
  context: Context<ServerBindings>,
  params: LogoDesignRunIdParams
) {
  const userId = requireUserId(context)

  const run = await logoDesignService.getRunByIdForUser(params.id, userId)
  if (!run) {
    return fail(context, 404, "Logo design run not found")
  }

  const assets = await logoDesignService.listAssetsByRunId(run.id)
  return ok(
    context,
    assets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      metadata: a.metadata,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
      createdAt: a.createdAt.toISOString(),
    }))
  )
}

export async function getLogoDesignAsset(
  context: Context<ServerBindings>,
  params: LogoDesignAssetIdParams
) {
  const userId = requireUserId(context)

  const run = await logoDesignService.getRunByIdForUser(params.id, userId)
  if (!run) {
    return fail(context, 404, "Logo design run not found")
  }

  const assets = await logoDesignService.listAssetsByRunId(run.id)
  const asset = assets.find((a) => a.id === params.assetId)
  if (!asset) {
    return fail(context, 404, "Asset not found")
  }

  if (asset.contentText) {
    const contentType = asset.mimeType ?? "text/plain"
    return new Response(asset.contentText, {
      headers: {
        "Content-Type": contentType,
      },
    })
  }

  if (asset.storageKey) {
    return fail(context, 501, "S3 asset download not yet implemented")
  }

  return fail(context, 404, "Asset content not found")
}
