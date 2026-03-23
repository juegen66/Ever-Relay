import { z } from "zod"

import { apiSuccessSchema } from "./common"
import { thirdPartyAppSlugSchema } from "./third-party-mcp"

export const thirdPartyAppConfigSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  appSlug: thirdPartyAppSlugSchema,
  displayName: z.string(),
  websiteUrl: z.string().url().nullable(),
  allowedOrigins: z.array(z.string()),
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ThirdPartyAppConfig = z.infer<typeof thirdPartyAppConfigSchema>

export const createThirdPartyAppBodySchema = z.object({
  appSlug: thirdPartyAppSlugSchema,
  displayName: z.string().trim().min(1).max(120),
})

export type CreateThirdPartyAppBody = z.infer<typeof createThirdPartyAppBodySchema>

export const thirdPartyAppParamsSchema = z.object({
  appSlug: thirdPartyAppSlugSchema,
})

export type ThirdPartyAppParams = z.infer<typeof thirdPartyAppParamsSchema>

export const updateThirdPartyAppBodySchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    websiteUrl: z.string().trim().url().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.websiteUrl !== undefined ||
      value.metadata !== undefined,
    {
      message: "At least one field is required",
    }
  )

export type UpdateThirdPartyAppBody = z.infer<typeof updateThirdPartyAppBodySchema>

export const thirdPartyAppsContracts = {
  listApps: {
    responseSchema: apiSuccessSchema(z.array(thirdPartyAppConfigSchema)),
  },
  createApp: {
    bodySchema: createThirdPartyAppBodySchema,
    responseSchema: apiSuccessSchema(thirdPartyAppConfigSchema),
  },
  getApp: {
    paramsSchema: thirdPartyAppParamsSchema,
    responseSchema: apiSuccessSchema(thirdPartyAppConfigSchema),
  },
  updateApp: {
    paramsSchema: thirdPartyAppParamsSchema,
    bodySchema: updateThirdPartyAppBodySchema,
    responseSchema: apiSuccessSchema(thirdPartyAppConfigSchema),
  },
  deleteApp: {
    paramsSchema: thirdPartyAppParamsSchema,
    responseSchema: apiSuccessSchema(
      z.object({
        deleted: z.literal(true),
      })
    ),
  },
} as const
