import { z } from "zod"

const TRUE_VALUES = new Set(["1", "true"])
const FALSE_VALUES = new Set(["0", "false"])

function normalizeBooleanQuery(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return value

  const normalized = value.trim().toLowerCase()
  if (TRUE_VALUES.has(normalized)) return true
  if (FALSE_VALUES.has(normalized)) return false

  return value
}

function normalizeIntegerQuery(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value
  if (typeof value !== "string") return value
  if (!value.trim()) return undefined

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return value

  return parsed
}

export const optionalBooleanQuerySchema = z.preprocess(
  normalizeBooleanQuery,
  z.boolean().optional()
)

export const optionalIntegerQuerySchema = z.preprocess(
  normalizeIntegerQuery,
  z.number().int().optional()
)

export const apiErrorCodeSchema = z.number().int().min(400).max(599)

export const apiSuccessBaseSchema = z.object({
  success: z.literal(true),
  code: z.literal(0),
  requestId: z.string(),
  message: z.string().optional(),
})

export function apiSuccessSchema<TData extends z.ZodTypeAny>(dataSchema: TData) {
  return apiSuccessBaseSchema.extend({
    data: dataSchema,
  })
}

export const apiErrorSchema = z.object({
  success: z.literal(false),
  code: apiErrorCodeSchema,
  message: z.string(),
  requestId: z.string(),
  data: z.unknown().optional(),
})

export type ApiSuccess<TData> = {
  success: true
  code: 0
  requestId: string
  message?: string
  data: TData
}

export type ApiError = z.infer<typeof apiErrorSchema>
export type ApiResponse<TData = unknown> = ApiSuccess<TData> | ApiError
