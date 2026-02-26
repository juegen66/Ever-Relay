import { z } from "zod"

export const requestContextSchema = z.object({
  userId: z.string().min(1),
})
