import { z } from "zod"

export const requestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  appId: z.string().uuid().nullable().optional(),
})
