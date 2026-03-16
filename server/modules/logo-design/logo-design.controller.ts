import { createHash, randomUUID } from "node:crypto"

import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_REQUESTED_EVENT } from "@/server/mastra/inngest/events"
import { logoDesignWorkflow } from "@/server/mastra/inngest/orchestrators/logo-design.orchestrator"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import type { ServerBindings } from "@/server/types"
import type {
  CreateLogoDesignParams,
  LogoDesignAssetIdParams,
  LogoDesignAssetType,
  LogoDesignRunIdParams,
} from "@/shared/contracts/logo-design"

import { logoDesignService } from "./logo-design.service"

import type { Context } from "hono"

const LOGO_DESIGN_CONCURRENCY_LIMIT = 2
const LOGO_DESIGN_STAGE_PROGRESS: Record<string, { current: number; total: number; label: string }> = {
  queued: { current: 0, total: 4, label: "排队中..." },
  planning: { current: 1, total: 4, label: "正在提炼品牌上下文与设计哲学..." },
  brand_designing: { current: 2, total: 4, label: "正在产出 3 个 Logo SVG 概念..." },
  poster_designing: { current: 3, total: 4, label: "正在生成海报 SVG..." },
  persisting: { current: 3, total: 4, label: "正在生成海报 SVG..." },
  complete: { current: 4, total: 4, label: "已完成" },
  failed: { current: 0, total: 4, label: "失败" },
}

type VirtualAsset = {
  id: string
  runId: string
  userId: string
  assetType: LogoDesignAssetType
  contentText: string
  mimeType: string
  metadata: Record<string, unknown>
  createdAt: string
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function detectConceptTypeFromSvg(svg: string) {
  const hasText = /<(text|tspan)\b/i.test(svg)
  const hasGraphics = /<(path|circle|ellipse|rect|polygon|polyline|line|use|image)\b/i.test(svg)
  if (hasGraphics && !hasText) {
    return "icon_only"
  }
  if (hasGraphics && hasText) {
    return "icon_with_wordmark"
  }
  if (!hasGraphics && hasText) {
    return "wordmark_only"
  }
  return null
}

function normalizeConceptType(value: unknown) {
  const raw = asString(value)?.toLowerCase()
  if (!raw) {
    return null
  }
  if (["icon_only", "icon-only", "icon", "symbol", "mark"].includes(raw)) {
    return "icon_only" as const
  }
  if (
    [
      "icon_with_wordmark",
      "icon+wordmark",
      "icon_wordmark",
      "full",
      "full_mark",
      "combination",
      "combo",
    ].includes(raw)
  ) {
    return "icon_with_wordmark" as const
  }
  if (["wordmark_only", "wordmark-only", "wordmark", "text", "text_only"].includes(raw)) {
    return "wordmark_only" as const
  }
  return null
}

function pickLogoSvgByConceptType(result: Record<string, unknown>) {
  const conceptsRaw = Array.isArray(result.logoConcepts) ? result.logoConcepts : []
  const typed = new Map<
    "icon_only" | "icon_with_wordmark" | "wordmark_only",
    string
  >()

  for (const item of conceptsRaw) {
    const concept = asRecord(item)
    if (!concept) {
      continue
    }
    const logoSvg = asString(concept.logoSvg)
    if (!logoSvg) {
      continue
    }
    const conceptType =
      normalizeConceptType(concept.conceptType) ??
      detectConceptTypeFromSvg(logoSvg)
    if (!conceptType || typed.has(conceptType)) {
      continue
    }
    typed.set(conceptType, logoSvg)
  }

  return {
    full: typed.get("icon_with_wordmark") ?? null,
    icon: typed.get("icon_only") ?? null,
    wordmark: typed.get("wordmark_only") ?? null,
  }
}

function virtualAssetId(runId: string, assetType: string) {
  const chars = createHash("sha1")
    .update(`${runId}:${assetType}`)
    .digest("hex")
    .slice(0, 32)
    .split("")
  chars[12] = "4"
  const variant = parseInt(chars[16] ?? "0", 16) % 4
  chars[16] = ["8", "9", "a", "b"][variant]
  const hash = chars.join("")
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

function collectVirtualAssets(run: {
  id: string
  userId: string
  planJson: unknown
  resultJson: unknown
  createdAt: Date
}): VirtualAsset[] {
  const result = asRecord(run.resultJson)
  if (!result) {
    return []
  }

  const brand = asRecord(result.brand)
  const poster = asRecord(result.poster)
  const logoSvg = asRecord(brand?.logoSvg)
  const byConceptType = pickLogoSvgByConceptType(result)
  const logoBriefMarkdown =
    asString(result.logoBriefMarkdown) ??
    asString(asRecord(run.planJson)?.logoBriefMarkdown)
  const designPhilosophyMarkdown =
    asString(result.designPhilosophyMarkdown) ??
    asString(asRecord(run.planJson)?.designPhilosophyMarkdown) ??
    asString(poster?.philosophyMd)

  const fullSvg =
    byConceptType.full ??
    asString(logoSvg?.full) ??
    asString(logoSvg?.icon) ??
    asString(logoSvg?.wordmark)
  const iconSvg = byConceptType.icon ?? asString(logoSvg?.icon) ?? fullSvg
  const wordmarkSvg =
    byConceptType.wordmark ?? asString(logoSvg?.wordmark) ?? fullSvg
  const posterSvg = asString(poster?.posterSvg)
  const brandGuidelines = asString(brand?.brandGuidelines) ?? logoBriefMarkdown

  const createdAt = run.createdAt.toISOString()
  const assets: VirtualAsset[] = []
  const pushAsset = (
    assetType: LogoDesignAssetType,
    contentText: string | null,
    mimeType: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!contentText) {
      return
    }
    assets.push({
      id: virtualAssetId(run.id, assetType),
      runId: run.id,
      userId: run.userId,
      assetType,
      contentText,
      mimeType,
      metadata: metadata ?? {},
      createdAt,
    })
  }

  pushAsset("logo_svg_full", fullSvg, "image/svg+xml")
  pushAsset("logo_svg_icon", iconSvg, "image/svg+xml")
  pushAsset("logo_svg_wordmark", wordmarkSvg, "image/svg+xml")
  pushAsset("poster_svg", posterSvg, "image/svg+xml")
  pushAsset("brand_guidelines", brandGuidelines, "text/markdown")
  pushAsset("design_philosophy", designPhilosophyMarkdown, "text/markdown")

  return assets
}

function mergeAssets<T extends { assetType: string }>(base: T[], incoming: T[]) {
  const byType = new Map<string, T>()
  for (const item of base) {
    byType.set(item.assetType, item)
  }
  for (const item of incoming) {
    if (!byType.has(item.assetType)) {
      byType.set(item.assetType, item)
    }
  }
  return Array.from(byType.values())
}

function mergeById<T extends { id: string }>(base: T[], incoming: T[]) {
  const byId = new Map<string, T>()
  for (const item of base) {
    byId.set(item.id, item)
  }
  for (const item of incoming) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item)
    }
  }
  return Array.from(byId.values())
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

  const persistedAssets =
    run.status === "completed"
      ? await logoDesignService.listAssetsByRunId(run.id)
      : []
  const virtualAssets = collectVirtualAssets(run)
  const mergedAssets = mergeAssets(
    persistedAssets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      metadata: a.metadata,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
    })),
    virtualAssets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      metadata: a.metadata,
      mimeType: a.mimeType,
      createdAt: a.createdAt,
    }))
  )

  return ok(context, {
    ...formatRunForResponse(run),
    assets: mergedAssets,
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

  const persistedAssets = await logoDesignService.listAssetsByRunId(run.id)
  const virtualAssets = collectVirtualAssets(run)
  const assets = mergeAssets(
    persistedAssets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      contentText: a.contentText ?? "",
      metadata: a.metadata,
      mimeType: a.mimeType ?? "text/plain",
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
      createdAt: a.createdAt.toISOString(),
    })),
    virtualAssets.map((a) => ({
      id: a.id,
      runId: a.runId,
      userId: a.userId,
      assetType: a.assetType,
      contentText: a.contentText,
      metadata: a.metadata,
      mimeType: a.mimeType,
      sizeBytes: null,
      width: null,
      height: null,
      createdAt: a.createdAt,
    }))
  )

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
      createdAt: a.createdAt,
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

  const persistedAssets = await logoDesignService.listAssetsByRunId(run.id)
  const virtualAssets = collectVirtualAssets(run)
  const assets = mergeById(
    persistedAssets.map((a) => ({
      id: a.id,
      contentText: a.contentText,
      storageKey: a.storageKey,
      mimeType: a.mimeType,
    })),
    virtualAssets.map((a) => ({
      id: a.id,
      contentText: a.contentText,
      storageKey: null,
      mimeType: a.mimeType,
    }))
  )
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
