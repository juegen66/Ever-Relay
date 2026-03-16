import { z } from "zod"

import { codingReportSchema } from "@/shared/contracts/coding-runs"

export const codingWorkflowInputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  appId: z.string().uuid(),
  report: codingReportSchema,
})

export const codingReportIngestOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  appId: z.string().uuid(),
  report: codingReportSchema,
  planText: z.string().min(1),
})

export const codingSandboxExecuteOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  appId: z.string().uuid(),
  report: codingReportSchema,
  planText: z.string().min(1),
  executionText: z.string(),
  executionJson: z.record(z.string(), z.unknown()).nullable(),
})

export const codingValidateOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  appId: z.string().uuid(),
  report: codingReportSchema,
  planText: z.string().min(1),
  executionText: z.string(),
  verdict: z.enum(["pass", "fail"]),
  reviewText: z.string(),
  reviewJson: z.record(z.string(), z.unknown()).nullable(),
})

export type CodingWorkflowInput = z.infer<typeof codingWorkflowInputSchema>
export type CodingReportIngestOutput = z.infer<typeof codingReportIngestOutputSchema>
export type CodingSandboxExecuteOutput = z.infer<typeof codingSandboxExecuteOutputSchema>
export type CodingValidateOutput = z.infer<typeof codingValidateOutputSchema>
