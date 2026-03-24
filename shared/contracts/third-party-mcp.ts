import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const thirdPartyMcpAuthTypeSchema = z.enum(["none", "bearer"])
export type ThirdPartyMcpAuthType = z.infer<typeof thirdPartyMcpAuthTypeSchema>

export const thirdPartyAppSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/, "Invalid third-party app slug")

export const thirdPartyMcpBindingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  appSlug: thirdPartyAppSlugSchema,
  serverUrl: z.string().url(),
  authType: thirdPartyMcpAuthTypeSchema,
  hasAuthToken: z.boolean(),
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ThirdPartyMcpBinding = z.infer<typeof thirdPartyMcpBindingSchema>

export const thirdPartyMcpBindingParamsSchema = z.object({
  appSlug: thirdPartyAppSlugSchema,
})

export type ThirdPartyMcpBindingParams = z.infer<typeof thirdPartyMcpBindingParamsSchema>

export const upsertThirdPartyMcpBindingBodySchema = z.object({
  serverUrl: z.string().trim().url(),
  authType: thirdPartyMcpAuthTypeSchema,
  authToken: z.string().trim().min(1).max(4000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpsertThirdPartyMcpBindingBody = z.infer<typeof upsertThirdPartyMcpBindingBodySchema>

export const thirdPartyMcpBindingGetResponseSchema = apiSuccessSchema(
  z.object({
    binding: thirdPartyMcpBindingSchema.nullable(),
  })
)

export const thirdPartyMcpBindingUpsertResponseSchema = apiSuccessSchema(
  thirdPartyMcpBindingSchema
)

export const thirdPartyMcpBindingDeleteResponseSchema = apiSuccessSchema(
  z.object({
    deleted: z.literal(true),
  })
)

export const thirdPartyMcpContracts = {
  getBinding: {
    paramsSchema: thirdPartyMcpBindingParamsSchema,
    responseSchema: thirdPartyMcpBindingGetResponseSchema,
  },
  upsertBinding: {
    paramsSchema: thirdPartyMcpBindingParamsSchema,
    bodySchema: upsertThirdPartyMcpBindingBodySchema,
    responseSchema: thirdPartyMcpBindingUpsertResponseSchema,
  },
  deleteBinding: {
    paramsSchema: thirdPartyMcpBindingParamsSchema,
    responseSchema: thirdPartyMcpBindingDeleteResponseSchema,
  },
} as const
