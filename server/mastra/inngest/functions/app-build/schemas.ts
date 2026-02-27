import { z } from "zod"

export const buildWorkflowInputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
})

export const buildPlanOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
  prompt: z.string().min(1),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
})

export const buildGenerateOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
  prompt: z.string().min(1),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  buildText: z.string(),
  buildJson: z.record(z.string(), z.unknown()).nullable(),
})

export const buildValidateOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
  prompt: z.string().min(1),
  planText: z.string(),
  buildText: z.string(),
  verdict: z.enum(["pass", "fail"]),
  reviewText: z.string(),
  reviewJson: z.record(z.string(), z.unknown()).nullable(),
})

export type BuildWorkflowInput = z.infer<typeof buildWorkflowInputSchema>
export type BuildPlanOutput = z.infer<typeof buildPlanOutputSchema>
export type BuildGenerateOutput = z.infer<typeof buildGenerateOutputSchema>
export type BuildValidateOutput = z.infer<typeof buildValidateOutputSchema>

