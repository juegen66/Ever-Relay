import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const codingAppStatusSchema = z.enum(["active", "archived"])

export const codingAppSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  sandboxId: z.string(),
  threadId: z.string(),
  status: codingAppStatusSchema,
  lastOpenedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CodingApp = z.infer<typeof codingAppSchema>

export const createCodingAppParamsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
})

export type CreateCodingAppParams = z.infer<typeof createCodingAppParamsSchema>

export const codingAppIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export type CodingAppIdParams = z.infer<typeof codingAppIdParamsSchema>

export const codingAppsContracts = {
  createCodingApp: {
    bodySchema: createCodingAppParamsSchema,
    responseSchema: apiSuccessSchema(codingAppSchema),
  },
  listCodingApps: {
    responseSchema: apiSuccessSchema(z.array(codingAppSchema)),
  },
  getCodingApp: {
    paramsSchema: codingAppIdParamsSchema,
    responseSchema: apiSuccessSchema(codingAppSchema),
  },
  activateCodingApp: {
    paramsSchema: codingAppIdParamsSchema,
    responseSchema: apiSuccessSchema(codingAppSchema),
  },
} as const
