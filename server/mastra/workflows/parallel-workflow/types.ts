import { z } from "zod"

const emptyStringIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value

export const parallelTaskSchema = z.object({
  id: z.string().trim().min(1).describe("Unique task id, e.g. T1"),
  name: z.string().trim().min(1).describe("Short task name"),
  agentId: z
    .preprocess(emptyStringIfMissing, z.string())
    .describe("Agent id to execute this task"),
  dependsOn: z.array(z.string().trim().min(1)).default([]),
  location: z
    .preprocess(emptyStringIfMissing, z.string())
    .describe("Optional path, scope, or module name"),
  prerequisites: z
    .preprocess(emptyStringIfMissing, z.string())
    .describe("Execution context the worker should know before starting"),
  description: z.string().trim().min(1),
  acceptanceCriteria: z.array(z.string().trim().min(1)).min(1),
  validation: z
    .preprocess(emptyStringIfMissing, z.string())
    .describe("How the task should be validated"),
})

export type ParallelTask = z.infer<typeof parallelTaskSchema>

export const parallelPlanSchema = z.object({
  tasks: z.array(parallelTaskSchema).min(1),
})

export type ParallelPlan = z.infer<typeof parallelPlanSchema>

export const parallelTaskReportSchema = z.object({
  taskId: z.string().trim().min(1),
  taskName: z.string().trim().min(1),
  status: z.enum(["done", "blocked", "partial"]),
  summary: z.string().trim().min(1),
})

export type ParallelTaskReport = z.infer<typeof parallelTaskReportSchema>

export const parallelComplexitySchema = z.object({
  isComplex: z.boolean(),
  score: z.number().int().min(0),
  reasons: z.array(z.string().trim().min(1)),
})

export type ParallelComplexity = z.infer<typeof parallelComplexitySchema>

export const parallelWorkflowInputSchema = z.object({
  request: z.string().trim().min(1),
  sourceAgentId: z.string().trim().min(1),
})

export type ParallelWorkflowInput = z.infer<typeof parallelWorkflowInputSchema>

export const parallelWorkflowOutputSchema = z.object({
  synthesis: z.string(),
})

export type ParallelWorkflowOutput = z.infer<typeof parallelWorkflowOutputSchema>

export const parallelWorkflowStateSchema = z.object({
  plan: parallelPlanSchema.nullable(),
  allowedTaskAgentIds: z.array(z.string().trim().min(1)),
  completedTaskIds: z.array(z.string().trim().min(1)),
  allReports: z.array(parallelTaskReportSchema),
  sourceAgentId: z.string().trim().min(1).nullable(),
})

export type ParallelWorkflowState = z.infer<typeof parallelWorkflowStateSchema>

export const parallelWorkflowRunResultSchema = z.object({
  accepted: z.boolean(),
  routed: z.boolean(),
  status: z.enum(["not_routed", "success", "failed"]),
  reason: z.string().nullable(),
  synthesis: z.string(),
  complexity: parallelComplexitySchema,
  plan: parallelPlanSchema.nullable(),
  completedTaskIds: z.array(z.string().trim().min(1)),
  reports: z.array(parallelTaskReportSchema),
})

export type ParallelWorkflowRunResult = z.infer<
  typeof parallelWorkflowRunResultSchema
>
