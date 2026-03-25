import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm"

import type {
  CanvasProjectListParams,
  CreateCanvasProjectParams,
  GenerateCanvasSvgParams,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
} from "@/shared/contracts/canvas"
import { db } from "@/server/core/database"
import {
  canvasSvgGenerationOutputSchema,
  canvasSvgGeneratorAgent,
} from "@/server/mastra/agents/canvas/canvas-svg-generator-agent"
import model from "@/server/mastra/model"
import {
  canvasProjectActivityLogs,
  canvasProjectTags,
  canvasProjects,
  canvasTags,
} from "@/server/db/schema"

const DEFAULT_LIST_LIMIT = 40
const MAX_LIST_LIMIT = 100
const MAX_SVG_LENGTH = 200_000
const SVG_BLOCKED_TAG_PATTERN = /<\s*(script|style|foreignObject|iframe|object|embed|audio|video|image|use|filter|mask|pattern|animate|animateMotion|animateTransform|set|a)\b/i
const SVG_EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i
const SVG_JAVASCRIPT_HREF_PATTERN = /\b(?:href|xlink:href)\s*=\s*['"]?\s*javascript:/i
const SVG_EXTERNAL_HREF_PATTERN = /\b(?:href|xlink:href)\s*=\s*['"]?\s*(?!#)[^"' >]+/i
const SVG_FENCE_PATTERN = /```(?:svg|xml)?\s*([\s\S]*?)\s*```/i
const SVG_DOCUMENT_PATTERN = /<svg\b[\s\S]*<\/svg>/i
const SVG_XML_DECLARATION_PATTERN = /^\s*<\?xml[\s\S]*?\?>\s*/i
const SVG_DOCTYPE_PATTERN = /^\s*<!DOCTYPE[\s\S]*?>\s*/i

type CanvasProjectRecord = typeof canvasProjects.$inferSelect
type CanvasTagRecord = typeof canvasTags.$inferSelect

export interface CanvasProjectWithTags extends CanvasProjectRecord {
  tags: CanvasTagRecord[]
}

export type CreateCanvasProjectInput = CreateCanvasProjectParams & {
  userId: string
}

interface ListResult {
  items: CanvasProjectWithTags[]
  nextCursor: string | null
}

interface UpdateContentConflictResult {
  ok: false
  reason: "not_found" | "version_conflict"
  expectedVersion?: number
}

interface UpdateContentSuccessResult {
  ok: true
  project: CanvasProjectWithTags
}

export type UpdateContentResult = UpdateContentConflictResult | UpdateContentSuccessResult

interface GenerateSvgResult {
  prompt: string
  width: number
  height: number
  svg: string
  generatedAt: string
}

export class CanvasSvgValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CanvasSvgValidationError"
  }
}

export class CanvasSvgGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = "CanvasSvgGenerationError"
    if (options?.cause !== undefined) {
      Object.assign(this, { cause: options.cause })
    }
  }
}

function normalizeLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIST_LIMIT
  }
  return Math.min(Math.max(limit, 1), MAX_LIST_LIMIT)
}

function normalizeOffset(cursor?: string) {
  if (!cursor) return 0
  const parsed = Number.parseInt(cursor, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

function trimCopySuffixTitle(title: string) {
  if (title.length <= 240) {
    return title
  }
  return title.slice(0, 240)
}

function extractSvgMarkup(markup: string) {
  let normalized = markup.trim()
  const fenced = normalized.match(SVG_FENCE_PATTERN)?.[1]
  if (fenced?.trim()) {
    normalized = fenced.trim()
  }

  normalized = normalized
    .replace(/^\uFEFF/, "")
    .replace(SVG_XML_DECLARATION_PATTERN, "")
    .replace(SVG_DOCTYPE_PATTERN, "")
    .trim()

  const svgDocument = normalized.match(SVG_DOCUMENT_PATTERN)?.[0]
  if (svgDocument?.trim()) {
    normalized = svgDocument.trim()
  }

  return normalized
}

function upsertSvgAttribute(openingTag: string, name: string, value: string) {
  const attributePattern = new RegExp(`\\b${name}\\s*=\\s*(['"])[^'"]*\\1`, "i")
  if (attributePattern.test(openingTag)) {
    return openingTag.replace(attributePattern, `${name}="${value}"`)
  }

  return openingTag.replace(/<svg/i, (match) => `${match} ${name}="${value}"`)
}

function normalizeSvgRootAttributes(markup: string, width: number, height: number) {
  const openingTagMatch = markup.match(/<svg\b[^>]*>/i)
  const openingTag = openingTagMatch?.[0]
  if (!openingTag) {
    throw new CanvasSvgValidationError("SVG payload must be a full <svg>...</svg> document")
  }

  let normalizedTag = openingTag
  normalizedTag = upsertSvgAttribute(normalizedTag, "xmlns", "http://www.w3.org/2000/svg")
  normalizedTag = upsertSvgAttribute(normalizedTag, "width", String(width))
  normalizedTag = upsertSvgAttribute(normalizedTag, "height", String(height))
  normalizedTag = upsertSvgAttribute(normalizedTag, "viewBox", `0 0 ${width} ${height}`)

  return markup.replace(openingTag, normalizedTag)
}

function validateSvgMarkup(markup: string, width: number, height: number) {
  const normalized = normalizeSvgRootAttributes(extractSvgMarkup(markup), width, height)
  if (!normalized) {
    throw new CanvasSvgValidationError("svg is required")
  }

  if (normalized.length > MAX_SVG_LENGTH) {
    throw new CanvasSvgValidationError("SVG payload is too large")
  }

  const lower = normalized.toLowerCase()
  if (!lower.startsWith("<svg") || !lower.includes("</svg>")) {
    throw new CanvasSvgValidationError("SVG payload must be a full <svg>...</svg> document")
  }

  if (SVG_BLOCKED_TAG_PATTERN.test(normalized)) {
    throw new CanvasSvgValidationError("SVG contains blocked tags")
  }

  if (SVG_EVENT_HANDLER_PATTERN.test(normalized)) {
    throw new CanvasSvgValidationError("SVG contains blocked event handler attributes")
  }

  if (SVG_JAVASCRIPT_HREF_PATTERN.test(normalized)) {
    throw new CanvasSvgValidationError("SVG contains blocked javascript href")
  }

  if (SVG_EXTERNAL_HREF_PATTERN.test(normalized)) {
    throw new CanvasSvgValidationError("SVG contains blocked external href")
  }

  return normalized
}

function buildCanvasSvgPrompt(input: {
  prompt: string
  width: number
  height: number
}) {
  return [
    "Generate original SVG artwork for the EverRelay Canvas app.",
    `User request: ${input.prompt}`,
    `Required size: ${input.width}x${input.height}`,
    "",
    "Hard requirements:",
    `- Return one complete <svg> document with width=\"${input.width}\" height=\"${input.height}\" viewBox=\"0 0 ${input.width} ${input.height}\".`,
    "- Produce a real design based on the request, not a placeholder card and not a plain prompt echo.",
    "- Use only inline SVG elements and attributes.",
    "- Prefer paths, groups, gradients, and layered vector composition when helpful.",
    "- Use text only when the request explicitly asks for text or lettering.",
    "- No markdown fences, prose, comments, scripts, styles, filters, masks, external resources, or raster images.",
    "- Keep the output renderable by common SVG parsers such as Fabric.js.",
    "",
    "Compatibility subset:",
    "- Allowed: svg, g, defs, linearGradient, radialGradient, stop, rect, circle, ellipse, path, polygon, polyline, line, text, tspan, clipPath.",
    "- Disallowed: script, style, foreignObject, iframe, object, embed, audio, video, image, use, filter, mask, pattern, animation, anchor tags.",
    "",
    "Design guidance:",
    "- Make the composition intentional and visually finished.",
    "- Use the whole canvas when the request suggests a poster, scene, or background.",
    "- Preserve negative space when the request suggests an icon or emblem.",
    "- Transparent background is acceptable unless the request asks for a background.",
  ].join("\n")
}

function buildCanvasSvgRepairPrompt(input: {
  prompt: string
  width: number
  height: number
  invalidSvg: string
  validationError: string
}) {
  return [
    "Repair the SVG so it becomes valid and safe for the EverRelay Canvas app.",
    `Original user request: ${input.prompt}`,
    `Required size: ${input.width}x${input.height}`,
    `Validation error: ${input.validationError}`,
    "",
    "Return one corrected <svg> document only in the svg field.",
    `The root element must use width=\"${input.width}\" height=\"${input.height}\" viewBox=\"0 0 ${input.width} ${input.height}\".`,
    "Keep the original design intent, but remove incompatible or blocked constructs.",
    "Do not use markdown fences, scripts, styles, filters, masks, patterns, external hrefs, images, use tags, or animation.",
    "",
    "Invalid SVG to repair:",
    input.invalidSvg,
  ].join("\n")
}

export class CanvasService {
  private async withTags(projects: CanvasProjectRecord[]): Promise<CanvasProjectWithTags[]> {
    if (projects.length === 0) {
      return []
    }

    const projectIds = projects.map((project) => project.id)

    const rows = await db
      .select({
        projectId: canvasProjectTags.projectId,
        tag: canvasTags,
      })
      .from(canvasProjectTags)
      .innerJoin(canvasTags, eq(canvasProjectTags.tagId, canvasTags.id))
      .where(inArray(canvasProjectTags.projectId, projectIds))

    const tagsMap = new Map<string, CanvasTagRecord[]>()
    rows.forEach(({ projectId, tag }) => {
      const current = tagsMap.get(projectId) ?? []
      current.push(tag)
      tagsMap.set(projectId, current)
    })

    return projects.map((project) => ({
      ...project,
      tags: tagsMap.get(project.id) ?? [],
    }))
  }

  private async logActivity(projectId: string, userId: string, action: string, payload: Record<string, unknown> = {}) {
    await db.insert(canvasProjectActivityLogs).values({
      projectId,
      userId,
      action,
      payload,
    })
  }

  private async validateTagIds(userId: string, tagIds: string[]) {
    if (tagIds.length === 0) {
      return []
    }

    const tags = await db
      .select()
      .from(canvasTags)
      .where(and(eq(canvasTags.userId, userId), inArray(canvasTags.id, tagIds)))

    if (tags.length !== tagIds.length) {
      throw new Error("One or more tags are invalid")
    }

    return tags
  }

  private async syncProjectTags(projectId: string, userId: string, tagIds: string[]) {
    await this.validateTagIds(userId, tagIds)

    await db.delete(canvasProjectTags).where(eq(canvasProjectTags.projectId, projectId))

    if (tagIds.length > 0) {
      await db.insert(canvasProjectTags).values(
        tagIds.map((tagId) => ({
          projectId,
          tagId,
        }))
      )
    }
  }

  async listProjects(userId: string, query: CanvasProjectListParams): Promise<ListResult> {
    const limit = normalizeLimit(query.limit)
    const offset = normalizeOffset(query.cursor)

    const conditions = [eq(canvasProjects.userId, userId)]

    if (query.deletedOnly) {
      conditions.push(isNotNull(canvasProjects.deletedAt))
    } else if (!query.includeDeleted) {
      conditions.push(isNull(canvasProjects.deletedAt))
    }

    if (query.q && query.q.trim()) {
      const keyword = `%${query.q.trim()}%`
      conditions.push(or(ilike(canvasProjects.title, keyword), ilike(canvasProjects.description, keyword))!)
    }

    if (query.status && query.status.length > 0) {
      conditions.push(inArray(canvasProjects.status, query.status))
    }

    if (query.tagId) {
      conditions.push(
        sql`exists (
          select 1
          from ${canvasProjectTags}
          where ${canvasProjectTags.projectId} = ${canvasProjects.id}
            and ${canvasProjectTags.tagId} = ${query.tagId}
        )`
      )
    }

    const whereClause = and(...conditions)

    const sort = query.sort ?? "updated"
    const order = query.order ?? "desc"

    const orderByExpr =
      sort === "created"
        ? order === "asc"
          ? asc(canvasProjects.createdAt)
          : desc(canvasProjects.createdAt)
        : sort === "title"
          ? order === "asc"
            ? asc(canvasProjects.title)
            : desc(canvasProjects.title)
          : order === "asc"
            ? asc(canvasProjects.updatedAt)
            : desc(canvasProjects.updatedAt)

    const projects = await db
      .select()
      .from(canvasProjects)
      .where(whereClause)
      .orderBy(orderByExpr, desc(canvasProjects.updatedAt), desc(canvasProjects.id))
      .limit(limit + 1)
      .offset(offset)

    const hasMore = projects.length > limit
    const sliced = hasMore ? projects.slice(0, limit) : projects

    return {
      items: await this.withTags(sliced),
      nextCursor: hasMore ? String(offset + limit) : null,
    }
  }

  async getProjectById(id: string, userId: string, { includeDeleted = false } = {}) {
    const conditions = [eq(canvasProjects.id, id), eq(canvasProjects.userId, userId)]
    if (!includeDeleted) {
      conditions.push(isNull(canvasProjects.deletedAt))
    }

    const project = await db.query.canvasProjects.findFirst({
      where: and(...conditions),
    })

    if (!project) return null

    const [result] = await this.withTags([project])

    return result ?? null
  }

  async createProject(input: CreateCanvasProjectInput) {
    const canvasWidth = Math.max(120, input.canvasWidth ?? 1200)
    const canvasHeight = Math.max(120, input.canvasHeight ?? 800)
    const tagIds = Array.from(new Set(input.tagIds ?? []))

    const [project] = await db
      .insert(canvasProjects)
      .values({
        userId: input.userId,
        title: input.title,
        description: input.description ?? null,
        canvasWidth,
        canvasHeight,
        contentJson: {},
      })
      .returning()

    if (tagIds.length > 0) {
      await this.syncProjectTags(project.id, input.userId, tagIds)
    }

    await this.logActivity(project.id, input.userId, "create", {
      title: project.title,
    })

    const fullProject = await this.getProjectById(project.id, input.userId)

    if (!fullProject) {
      throw new Error("Failed to load project after creation")
    }

    return fullProject
  }

  async updateProject(id: string, userId: string, input: UpdateCanvasProjectParams) {
    const existing = await this.getProjectById(id, userId, { includeDeleted: true })
    if (!existing) return null

    const updatePayload: Partial<typeof canvasProjects.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.title !== undefined) {
      updatePayload.title = input.title
    }

    if (input.description !== undefined) {
      updatePayload.description = input.description
    }

    if (input.visibility !== undefined) {
      updatePayload.visibility = input.visibility
    }

    if (input.thumbnailUrl !== undefined) {
      updatePayload.thumbnailUrl = input.thumbnailUrl
    }

    if (input.status !== undefined) {
      updatePayload.status = input.status
      if (input.status === "published") {
        updatePayload.publishedAt = new Date()
        updatePayload.archivedAt = null
      }
      if (input.status === "archived") {
        updatePayload.archivedAt = new Date()
      }
      if (input.status === "draft") {
        updatePayload.archivedAt = null
      }
    }

    const [updated] = await db
      .update(canvasProjects)
      .set(updatePayload)
      .where(and(eq(canvasProjects.id, id), eq(canvasProjects.userId, userId)))
      .returning()

    if (!updated) return null

    if (input.tagIds) {
      await this.syncProjectTags(id, userId, Array.from(new Set(input.tagIds)))
    }

    await this.logActivity(id, userId, "update", {
      fields: Object.keys(input),
    })

    return this.getProjectById(id, userId, { includeDeleted: true })
  }

  async updateProjectContent(id: string, userId: string, input: UpdateCanvasProjectContentParams): Promise<UpdateContentResult> {
    const existing = await this.getProjectById(id, userId)
    if (!existing) {
      return { ok: false, reason: "not_found" }
    }

    if (existing.contentVersion !== input.contentVersion) {
      return {
        ok: false,
        reason: "version_conflict",
        expectedVersion: existing.contentVersion,
      }
    }

    const [updated] = await db
      .update(canvasProjects)
      .set({
        contentJson: input.contentJson,
        contentVersion: existing.contentVersion + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(canvasProjects.id, id), eq(canvasProjects.userId, userId), eq(canvasProjects.contentVersion, input.contentVersion)))
      .returning()

    if (!updated) {
      const latest = await this.getProjectById(id, userId)
      return {
        ok: false,
        reason: "version_conflict",
        expectedVersion: latest?.contentVersion,
      }
    }

    await this.logActivity(id, userId, "update_content", {
      contentVersion: updated.contentVersion,
    })

    const fullProject = await this.getProjectById(id, userId)
    if (!fullProject) {
      return { ok: false, reason: "not_found" }
    }

    return { ok: true, project: fullProject }
  }

  private async requestGeneratedSvg(prompt: string) {
    try {
      const output = await canvasSvgGeneratorAgent.generate(prompt, {
        maxSteps: 1,
        toolChoice: "none",
        structuredOutput: {
          schema: canvasSvgGenerationOutputSchema,
          model: model.lzmodel4oMini,
          jsonPromptInjection: true,
        },
      })

      return canvasSvgGenerationOutputSchema.parse(output.object).svg
    } catch (error) {
      throw new CanvasSvgGenerationError("Canvas SVG model request failed", {
        cause: error,
      })
    }
  }

  async generateSvgCode(input: GenerateCanvasSvgParams): Promise<GenerateSvgResult> {
    const prompt = input.prompt.trim()
    if (!prompt) {
      throw new CanvasSvgValidationError("prompt is required")
    }

    const width = Math.max(120, Math.min(2400, Math.trunc(input.width ?? 720)))
    const height = Math.max(120, Math.min(2400, Math.trunc(input.height ?? 480)))
    let invalidSvg = ""
    let validationError = ""

    try {
      invalidSvg = await this.requestGeneratedSvg(
        buildCanvasSvgPrompt({
          prompt,
          width,
          height,
        })
      )

      const normalizedSvg = validateSvgMarkup(invalidSvg, width, height)
      return {
        prompt,
        width,
        height,
        svg: normalizedSvg,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      if (error instanceof CanvasSvgGenerationError) {
        throw error
      }

      if (error instanceof CanvasSvgValidationError) {
        validationError = error.message
      } else {
        throw new CanvasSvgGenerationError("Canvas SVG generation failed", {
          cause: error,
        })
      }
    }

    const repairedSvg = await this.requestGeneratedSvg(
      buildCanvasSvgRepairPrompt({
        prompt,
        width,
        height,
        invalidSvg: invalidSvg.slice(0, 12_000),
        validationError: validationError || "Generated SVG failed validation.",
      })
    )

    const normalizedSvg = validateSvgMarkup(repairedSvg, width, height)
    return {
      prompt,
      width,
      height,
      svg: normalizedSvg,
      generatedAt: new Date().toISOString(),
    }
  }

  async markProjectOpened(id: string, userId: string) {
    await db
      .update(canvasProjects)
      .set({
        lastOpenedAt: new Date(),
      })
      .where(and(eq(canvasProjects.id, id), eq(canvasProjects.userId, userId)))
  }

  async duplicateProject(id: string, userId: string) {
    const source = await this.getProjectById(id, userId)
    if (!source) return null

    const [copy] = await db
      .insert(canvasProjects)
      .values({
        userId,
        title: trimCopySuffixTitle(`${source.title} (Copy)`),
        description: source.description,
        status: "draft",
        visibility: source.visibility,
        canvasWidth: source.canvasWidth,
        canvasHeight: source.canvasHeight,
        thumbnailUrl: source.thumbnailUrl,
        contentJson: source.contentJson,
        contentVersion: 1,
      })
      .returning()

    if (source.tags.length > 0) {
      await db.insert(canvasProjectTags).values(
        source.tags.map((tag) => ({
          projectId: copy.id,
          tagId: tag.id,
        }))
      )
    }

    await this.logActivity(copy.id, userId, "duplicate", {
      sourceProjectId: source.id,
    })

    return this.getProjectById(copy.id, userId)
  }

  async softDeleteProject(id: string, userId: string) {
    const [deleted] = await db
      .update(canvasProjects)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(canvasProjects.id, id), eq(canvasProjects.userId, userId), isNull(canvasProjects.deletedAt)))
      .returning()

    if (!deleted) return false

    await this.logActivity(id, userId, "delete")

    return true
  }

  async restoreProject(id: string, userId: string) {
    const [restored] = await db
      .update(canvasProjects)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(canvasProjects.id, id), eq(canvasProjects.userId, userId), isNotNull(canvasProjects.deletedAt)))
      .returning()

    if (!restored) return null

    await this.logActivity(id, userId, "restore")

    return this.getProjectById(id, userId)
  }

  async listTags(userId: string) {
    return db.query.canvasTags.findMany({
      where: eq(canvasTags.userId, userId),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    })
  }

  async createTag(userId: string, name: string, color?: string | null) {
    const normalized = name.trim()

    const existing = await db.query.canvasTags.findFirst({
      where: and(eq(canvasTags.userId, userId), eq(canvasTags.name, normalized)),
    })

    if (existing) {
      return existing
    }

    const [tag] = await db
      .insert(canvasTags)
      .values({
        userId,
        name: normalized,
        color: color ?? null,
      })
      .returning()

    return tag
  }
}

export const canvasService = new CanvasService()
