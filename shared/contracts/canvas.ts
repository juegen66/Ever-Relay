import { z } from "zod"

import {
  apiSuccessSchema,
  optionalBooleanQuerySchema,
  optionalIntegerQuerySchema,
} from "./common"

const canvasProjectIdSchema = z.string().uuid()
const canvasTagIdSchema = z.string().uuid()

export const canvasProjectStatusSchema = z.enum(["draft", "published", "archived"])
export type CanvasProjectStatus = z.infer<typeof canvasProjectStatusSchema>

export const canvasVisibilitySchema = z.enum(["private", "unlisted"])
export type CanvasVisibility = z.infer<typeof canvasVisibilitySchema>

export const canvasTagSchema = z.object({
  id: canvasTagIdSchema,
  userId: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  createdAt: z.string(),
})

export type CanvasTag = z.infer<typeof canvasTagSchema>

export const canvasProjectSchema = z.object({
  id: canvasProjectIdSchema,
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: canvasProjectStatusSchema,
  visibility: canvasVisibilitySchema,
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  thumbnailUrl: z.string().nullable(),
  contentJson: z.record(z.string(), z.unknown()),
  contentVersion: z.number().int(),
  lastOpenedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(canvasTagSchema),
})

export type CanvasProject = z.infer<typeof canvasProjectSchema>

const listProjectStatusSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  if (typeof value !== "string") {
    return value
  }

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : undefined
}, z.array(canvasProjectStatusSchema).optional())

export const listCanvasProjectsQuerySchema = z.object({
  q: z.preprocess((value) => {
    if (typeof value !== "string") return value
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : undefined
  }, z.string().optional()),
  status: listProjectStatusSchema,
  tagId: canvasTagIdSchema.optional(),
  sort: z.enum(["updated", "created", "title"]).default("updated"),
  order: z.enum(["asc", "desc"]).default("desc"),
  includeDeleted: optionalBooleanQuerySchema.default(false),
  deletedOnly: optionalBooleanQuerySchema.default(false),
  limit: optionalIntegerQuerySchema,
  cursor: z.string().optional(),
})

export type CanvasProjectListQuery = z.infer<typeof listCanvasProjectsQuerySchema>

export interface CanvasProjectListParams {
  q?: string
  status?: CanvasProjectStatus[]
  tagId?: string
  sort?: "updated" | "created" | "title"
  order?: "asc" | "desc"
  includeDeleted?: boolean
  deletedOnly?: boolean
  limit?: number
  cursor?: string
}

export const canvasProjectListResultSchema = z.object({
  items: z.array(canvasProjectSchema),
  nextCursor: z.string().nullable(),
})

export type CanvasProjectListResult = z.infer<typeof canvasProjectListResultSchema>

export const createCanvasProjectParamsSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  canvasWidth: z.number().int().positive().optional(),
  canvasHeight: z.number().int().positive().optional(),
  tagIds: z.array(canvasTagIdSchema).optional(),
})

export type CreateCanvasProjectParams = z.infer<typeof createCanvasProjectParamsSchema>

export const canvasProjectIdParamsSchema = z.object({
  id: canvasProjectIdSchema,
})

export type CanvasProjectIdParams = z.infer<typeof canvasProjectIdParamsSchema>

export const getCanvasProjectQuerySchema = z.object({
  includeDeleted: optionalBooleanQuerySchema.default(false),
})

export type GetCanvasProjectQuery = z.infer<typeof getCanvasProjectQuerySchema>

export const updateCanvasProjectParamsSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    status: canvasProjectStatusSchema.optional(),
    visibility: canvasVisibilitySchema.optional(),
    thumbnailUrl: z.string().nullable().optional(),
    tagIds: z.array(canvasTagIdSchema).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.status !== undefined ||
      value.visibility !== undefined ||
      value.thumbnailUrl !== undefined ||
      value.tagIds !== undefined,
    {
      message: "At least one field is required",
    }
  )

export type UpdateCanvasProjectParams = z.infer<typeof updateCanvasProjectParamsSchema>

export const updateCanvasProjectContentParamsSchema = z.object({
  contentJson: z.record(z.string(), z.unknown()),
  contentVersion: z.number().int().min(1),
})

export type UpdateCanvasProjectContentParams = z.infer<typeof updateCanvasProjectContentParamsSchema>

export const generateCanvasSvgParamsSchema = z.object({
  prompt: z.string().trim().min(1),
  width: z.number().int().min(120).max(2400).optional(),
  height: z.number().int().min(120).max(2400).optional(),
})

export type GenerateCanvasSvgParams = z.infer<typeof generateCanvasSvgParamsSchema>

export const generateCanvasSvgResponseDataSchema = z.object({
  prompt: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  svg: z.string(),
  generatedAt: z.string(),
})

export type GenerateCanvasSvgResponseData = z.infer<typeof generateCanvasSvgResponseDataSchema>

export const canvasProjectDeleteResponseDataSchema = z.object({
  deleted: z.literal(true),
})

export type CanvasProjectDeleteResponseData = z.infer<typeof canvasProjectDeleteResponseDataSchema>

export const updateCanvasProjectContentConflictDataSchema = z.object({
  expectedVersion: z.number().int().min(1).optional(),
})

export type UpdateCanvasProjectContentConflictData = z.infer<typeof updateCanvasProjectContentConflictDataSchema>

export const createCanvasTagParamsSchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().nullable().optional(),
})

export type CreateCanvasTagParams = z.infer<typeof createCanvasTagParamsSchema>

export const listCanvasProjectsResponseSchema = apiSuccessSchema(canvasProjectListResultSchema)
export const getCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const createCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const updateCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const updateCanvasProjectContentResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const generateCanvasSvgResponseSchema = apiSuccessSchema(generateCanvasSvgResponseDataSchema)
export const duplicateCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const restoreCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectSchema)
export const deleteCanvasProjectResponseSchema = apiSuccessSchema(canvasProjectDeleteResponseDataSchema)
export const listCanvasTagsResponseSchema = apiSuccessSchema(z.array(canvasTagSchema))
export const createCanvasTagResponseSchema = apiSuccessSchema(canvasTagSchema)

export const canvasContracts = {
  listProjects: {
    querySchema: listCanvasProjectsQuerySchema,
    responseSchema: listCanvasProjectsResponseSchema,
  },
  createProject: {
    bodySchema: createCanvasProjectParamsSchema,
    responseSchema: createCanvasProjectResponseSchema,
  },
  getProjectById: {
    paramsSchema: canvasProjectIdParamsSchema,
    querySchema: getCanvasProjectQuerySchema,
    responseSchema: getCanvasProjectResponseSchema,
  },
  updateProject: {
    paramsSchema: canvasProjectIdParamsSchema,
    bodySchema: updateCanvasProjectParamsSchema,
    responseSchema: updateCanvasProjectResponseSchema,
  },
  updateProjectContent: {
    paramsSchema: canvasProjectIdParamsSchema,
    bodySchema: updateCanvasProjectContentParamsSchema,
    responseSchema: updateCanvasProjectContentResponseSchema,
  },
  generateSvg: {
    bodySchema: generateCanvasSvgParamsSchema,
    responseSchema: generateCanvasSvgResponseSchema,
  },
  duplicateProject: {
    paramsSchema: canvasProjectIdParamsSchema,
    responseSchema: duplicateCanvasProjectResponseSchema,
  },
  deleteProject: {
    paramsSchema: canvasProjectIdParamsSchema,
    responseSchema: deleteCanvasProjectResponseSchema,
  },
  restoreProject: {
    paramsSchema: canvasProjectIdParamsSchema,
    responseSchema: restoreCanvasProjectResponseSchema,
  },
  listTags: {
    responseSchema: listCanvasTagsResponseSchema,
  },
  createTag: {
    bodySchema: createCanvasTagParamsSchema,
    responseSchema: createCanvasTagResponseSchema,
  },
} as const
