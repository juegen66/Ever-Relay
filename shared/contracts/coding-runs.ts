import { z } from "zod"

import { apiSuccessSchema } from "./common"

export const codingRunStageSchema = z.enum([
  "queued",
  "plan",
  "generate",
  "validate",
  "complete",
  "failed",
])

export const codingReportSchema = z.object({
  goal: z.string().trim().min(1),
  currentState: z.string().trim().min(1),
  clarifications: z.array(z.string().trim().min(1)).default([]),
  implementationPlan: z.array(z.string().trim().min(1)).min(1),
  constraints: z.array(z.string().trim().min(1)).default([]),
  acceptanceCriteria: z.array(z.string().trim().min(1)).min(1),
  sandboxTask: z.string().trim().min(1),
})

export type CodingReport = z.infer<typeof codingReportSchema>

export const createCodingRunParamsSchema = z.object({
  appId: z.string().uuid(),
  report: codingReportSchema,
})

export type CreateCodingRunParams = z.infer<typeof createCodingRunParamsSchema>

export const codingRunIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export type CodingRunIdParams = z.infer<typeof codingRunIdParamsSchema>

export const codingRunSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  appId: z.string().uuid(),
  workflowType: z.literal("coding-agent"),
  prompt: z.string(),
  stage: codingRunStageSchema,
  status: z.enum(["queued", "running", "completed", "failed"]),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  resultJson: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CodingRun = z.infer<typeof codingRunSchema>

export const createCodingRunResponseDataSchema = z.object({
  runId: z.string().uuid(),
  stage: codingRunStageSchema,
  status: z.literal("running"),
})

export type CreateCodingRunResponseData = z.infer<
  typeof createCodingRunResponseDataSchema
>

export const codingRunsContracts = {
  createCodingRun: {
    bodySchema: createCodingRunParamsSchema,
    responseSchema: apiSuccessSchema(createCodingRunResponseDataSchema),
  },
  getCodingRun: {
    paramsSchema: codingRunIdParamsSchema,
    responseSchema: apiSuccessSchema(codingRunSchema),
  },
} as const
