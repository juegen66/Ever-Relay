import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const removeBackgroundParamsSchema = z.object({
  imageDataUrl: z.string().trim().min(1),
})

export type RemoveBackgroundParams = z.infer<typeof removeBackgroundParamsSchema>

export const removeBackgroundResponseDataSchema = z.object({
  imageDataUrl: z.string(),
})

export type RemoveBackgroundResponse = z.infer<typeof removeBackgroundResponseDataSchema>

export const removeBackgroundResponseSchema = apiSuccessSchema(removeBackgroundResponseDataSchema)

export const imageProcessingContracts = {
  removeBackground: {
    bodySchema: removeBackgroundParamsSchema,
    responseSchema: removeBackgroundResponseSchema,
  },
} as const
