import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const workflowRunStageSchema = z.enum([
  "queued",
  "plan",
  "generate",
  "validate",
  "complete",
  "failed",
])

export type WorkflowRunStage = z.infer<typeof workflowRunStageSchema>

export const workflowRunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
])

export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>

export const createBuildParamsSchema = z.object({
  prompt: z.string().trim().min(1),
  projectId: z.string().min(1).optional(),
})

export type CreateBuildParams = z.infer<typeof createBuildParamsSchema>

export const buildRunIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export type BuildRunIdParams = z.infer<typeof buildRunIdParamsSchema>

export const workflowRunSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  projectId: z.string().nullable(),
  workflowType: z.literal("app-build"),
  stage: workflowRunStageSchema,
  status: workflowRunStatusSchema,
  prompt: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  resultJson: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type WorkflowRun = z.infer<typeof workflowRunSchema>

export const createBuildResponseDataSchema = z.object({
  runId: z.string().uuid(),
  stage: workflowRunStageSchema,
  status: workflowRunStatusSchema,
})

export type CreateBuildResponseData = z.infer<typeof createBuildResponseDataSchema>

export const createBuildResponseSchema = apiSuccessSchema(createBuildResponseDataSchema)
export const getBuildStatusResponseSchema = apiSuccessSchema(workflowRunSchema)

export const buildsContracts = {
  createBuild: {
    bodySchema: createBuildParamsSchema,
    responseSchema: createBuildResponseSchema,
  },
  getBuildStatus: {
    paramsSchema: buildRunIdParamsSchema,
    responseSchema: getBuildStatusResponseSchema,
  },
} as const
