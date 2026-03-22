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
