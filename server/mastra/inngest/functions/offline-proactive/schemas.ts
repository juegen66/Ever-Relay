import { z } from "zod"

import {
  offlineExecutionResultSchema,
  offlineProactiveWorkflowInputSchema,
} from "@/shared/contracts/offline-proactive"

export const offlineProactiveDiscoveryStepOutputSchema =
  offlineProactiveWorkflowInputSchema.extend({
    background: z.string(),
    task: z.string(),
    targetAgentId: z.string(),
  })

export const offlineProactiveExecutionStepOutputSchema =
  offlineProactiveDiscoveryStepOutputSchema.extend({
    execution: offlineExecutionResultSchema,
  })

export const offlineProactiveWorkflowOutputSchema =
  offlineProactiveExecutionStepOutputSchema.extend({
    activityId: z.string().uuid().nullable().optional(),
  })

export const offlineRunnableAgentSchema = z.object({
  agentId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const offlineCandidateFileSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  parentId: z.string().nullable(),
  contentVersion: z.number().int().nonnegative(),
  updatedAt: z.string().trim().min(1),
  preview: z.string(),
})

export const offlineProactiveGatherContextStepOutputSchema =
  offlineProactiveWorkflowInputSchema.extend({
    context: z.string(),
    runnableAgents: z.array(offlineRunnableAgentSchema),
    recentTextFiles: z.array(offlineCandidateFileSchema),
    skip: z.boolean(),
    skipReason: z.string().optional(),
  })

export const offlineProactivePlanTaskSchema = z.object({
  id: z.string().trim().min(1).describe("Unique task id, e.g. T1"),
  name: z.string().trim().min(1).describe("Short task name"),
  agentId: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? "")
    .describe("Agent id to execute this task"),
  dependsOn: z.array(z.string().trim().min(1)).default([]),
  location: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? "")
    .describe("Optional path, scope, or module name"),
  prerequisites: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? "")
    .describe("Execution context the worker should know before starting"),
  description: z.string().trim().min(1),
  acceptanceCriteria: z.array(z.string().trim().min(1)).min(1),
  validation: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? "")
    .describe("How the task should be validated"),
})

export const offlineProactivePlanSchema = z.object({
  tasks: z.array(offlineProactivePlanTaskSchema),
})

export const offlineProactiveTaskReportSchema = z.object({
  taskId: z.string().trim().min(1),
  taskName: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
  status: offlineExecutionResultSchema.shape.status,
  summary: z.string().trim().min(1),
  artifact: offlineExecutionResultSchema.shape.artifact.optional(),
  sourceFingerprint: offlineExecutionResultSchema.shape.sourceFingerprint.optional(),
})

export const offlineProactiveWorkflowStateSchema = z.object({
  plan: offlineProactivePlanSchema.nullable(),
  completedTaskIds: z.array(z.string().trim().min(1)),
  allReports: z.array(offlineProactiveTaskReportSchema),
})

export const offlineProactiveLoopStepSchema =
  offlineProactiveWorkflowInputSchema.extend({
    done: z.boolean(),
    synthesis: z.string(),
    plan: offlineProactivePlanSchema,
  })

export const offlineProactiveSchedulerInputSchema = z.object({
  userId: z.string().min(1).optional(),
  limit: z.number().int().positive().max(200).optional(),
})

export const offlineProactiveSchedulerOutputSchema = z.object({
  queuedUsers: z.number().int().nonnegative(),
  queuedUserIds: z.array(z.string().min(1)),
  failedUsers: z.array(
    z.object({
      userId: z.string().min(1),
      error: z.string().min(1),
    })
  ),
})
