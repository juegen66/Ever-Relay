import { z } from "zod"

export const offlineDiscoveryOutputSchema = z.object({
  background: z.string(),
  task: z.string(),
  targetAgentId: z.string(),
})

export type OfflineDiscoveryOutput = z.infer<typeof offlineDiscoveryOutputSchema>

export const offlineProactiveWorkflowInputSchema = z.object({
  userId: z.string().min(1),
  forceRun: z.boolean().optional(),
})

export type OfflineProactiveWorkflowInput = z.infer<typeof offlineProactiveWorkflowInputSchema>

export const offlineExecutionArtifactSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  href: z.string().nullable().optional(),
})

export type OfflineExecutionArtifact = z.infer<typeof offlineExecutionArtifactSchema>

export const offlineExecutionStatusSchema = z.enum([
  "completed",
  "skipped",
  "failed",
])

export const offlineExecutionResultSchema = z.object({
  status: offlineExecutionStatusSchema,
  summary: z.string(),
  artifact: offlineExecutionArtifactSchema.nullable().optional(),
  sourceFingerprint: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),
})

export type OfflineExecutionResult = z.infer<typeof offlineExecutionResultSchema>
