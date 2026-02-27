import { z } from "zod"

export const APP_BUILD_REQUESTED_EVENT = "app.build.requested" as const
export const APP_BUILD_COMPLETED_EVENT = "app.build.completed" as const
export const APP_BUILD_FAILED_EVENT = "app.build.failed" as const

export const appBuildRequestedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
})

export const appBuildCompletedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  summary: z.string().optional(),
})

export const appBuildFailedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  error: z.string().min(1),
})

export type AppBuildRequestedData = z.infer<typeof appBuildRequestedDataSchema>
export type AppBuildCompletedData = z.infer<typeof appBuildCompletedDataSchema>
export type AppBuildFailedData = z.infer<typeof appBuildFailedDataSchema>

