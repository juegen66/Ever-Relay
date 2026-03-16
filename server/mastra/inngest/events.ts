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

export const LOGO_DESIGN_REQUESTED_EVENT = "logo.design.requested" as const
export const LOGO_DESIGN_COMPLETED_EVENT = "logo.design.completed" as const
export const LOGO_DESIGN_FAILED_EVENT = "logo.design.failed" as const

export const logoDesignRequestedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
})

export const logoDesignCompletedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  summary: z.string().optional(),
})

export const logoDesignFailedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  error: z.string().min(1),
})

export type LogoDesignRequestedData = z.infer<typeof logoDesignRequestedDataSchema>
export type LogoDesignCompletedData = z.infer<typeof logoDesignCompletedDataSchema>
export type LogoDesignFailedData = z.infer<typeof logoDesignFailedDataSchema>

export const CODING_AGENT_REQUESTED_EVENT = "coding.agent.requested" as const
export const CODING_AGENT_COMPLETED_EVENT = "coding.agent.completed" as const
export const CODING_AGENT_FAILED_EVENT = "coding.agent.failed" as const

export const codingAgentRequestedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  appId: z.string().uuid(),
  report: z.record(z.string(), z.unknown()),
})

export const codingAgentCompletedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  summary: z.string().optional(),
})

export const codingAgentFailedDataSchema = z.object({
  runId: z.string().min(1),
  userId: z.string().min(1),
  error: z.string().min(1),
})

export type CodingAgentRequestedData = z.infer<typeof codingAgentRequestedDataSchema>
export type CodingAgentCompletedData = z.infer<typeof codingAgentCompletedDataSchema>
export type CodingAgentFailedData = z.infer<typeof codingAgentFailedDataSchema>
