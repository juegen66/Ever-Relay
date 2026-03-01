import { z } from "zod"
import { apiSuccessSchema } from "./common"

export const logoDesignStageSchema = z.enum([
  "queued",
  "planning",
  "brand_designing",
  "poster_designing",
  "persisting",
  "complete",
  "failed",
])

export const createLogoDesignParamsSchema = z.object({
  prompt: z.string().trim().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
})

export type CreateLogoDesignParams = z.infer<typeof createLogoDesignParamsSchema>

export const logoDesignRunIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export type LogoDesignRunIdParams = z.infer<typeof logoDesignRunIdParamsSchema>

export const logoDesignAssetIdParamsSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
})

export type LogoDesignAssetIdParams = z.infer<typeof logoDesignAssetIdParamsSchema>

export const logoDesignProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
})

export const logoDesignAssetTypeSchema = z.enum([
  "logo_svg_full",
  "logo_svg_icon",
  "logo_svg_wordmark",
  "logo_png",
  "color_palette",
  "typography_spec",
  "brand_guidelines",
  "design_philosophy",
  "poster_svg",
  "poster_png",
])

export type LogoDesignAssetType = z.infer<typeof logoDesignAssetTypeSchema>

export const logoDesignRunSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  workflowType: z.literal("logo-design"),
  prompt: z.string(),
  brandBrief: z.record(z.string(), z.unknown()).nullable(),
  stage: logoDesignStageSchema,
  status: z.enum(["queued", "running", "completed", "failed"]),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  resultJson: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  progress: logoDesignProgressSchema.optional(),
  assets: z.array(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type LogoDesignRun = z.infer<typeof logoDesignRunSchema>

export const logoDesignAssetSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  userId: z.string(),
  assetType: logoDesignAssetTypeSchema,
  contentText: z.string().nullable().optional(),
  storageKey: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
})

export type LogoDesignAsset = z.infer<typeof logoDesignAssetSchema>

export const createLogoDesignResponseDataSchema = z.object({
  runId: z.string().uuid(),
  stage: logoDesignStageSchema,
  status: z.literal("running"),
})

export type CreateLogoDesignResponseData = z.infer<
  typeof createLogoDesignResponseDataSchema
>

export const listLogoDesignsResponseSchema = apiSuccessSchema(
  z.array(logoDesignRunSchema)
)
export const getLogoDesignResponseSchema = apiSuccessSchema(logoDesignRunSchema)
export const getLogoDesignAssetsResponseSchema = apiSuccessSchema(
  z.array(logoDesignAssetSchema)
)

export const logoDesignContracts = {
  createLogoDesign: {
    bodySchema: createLogoDesignParamsSchema,
    responseSchema: apiSuccessSchema(createLogoDesignResponseDataSchema),
  },
  getLogoDesign: {
    paramsSchema: logoDesignRunIdParamsSchema,
    responseSchema: getLogoDesignResponseSchema,
  },
  listLogoDesigns: {
    responseSchema: listLogoDesignsResponseSchema,
  },
  getLogoDesignAssets: {
    paramsSchema: logoDesignRunIdParamsSchema,
    responseSchema: getLogoDesignAssetsResponseSchema,
  },
  getLogoDesignAsset: {
    paramsSchema: logoDesignAssetIdParamsSchema,
  },
} as const
