import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const healthResponseDataSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
})

export type HealthResponseData = z.infer<typeof healthResponseDataSchema>

export const healthResponseSchema = apiSuccessSchema(healthResponseDataSchema)

export const healthContracts = {
  getHealth: {
    responseSchema: healthResponseSchema,
  },
} as const
