import { z } from "zod"
import { HANDOFF_SCHEMA_VERSION } from "@/shared/copilot/handoff"
import { apiSuccessSchema } from "./common"

export const copilotHandoffMessageRoleSchema = z.enum([
  "user",
  "assistant",
  "developer",
  "system",
  "tool",
  "activity",
])

export const copilotHandoffMessageSchema = z.object({
  role: copilotHandoffMessageRoleSchema,
  content: z.string().trim().min(1),
})

export type CopilotHandoffMessage = z.infer<typeof copilotHandoffMessageSchema>

const optionalStringListSchema = z.array(z.string().trim().min(1)).optional()

export const handoffReportSchema = z.object({
  task: z.string(),
  contextDigest: z.string(),
  done: z.array(z.string()),
  nextSteps: z.array(z.string()),
  constraints: z.array(z.string()),
  artifacts: z.array(z.string()),
  openQuestions: z.array(z.string()),
  riskNotes: z.array(z.string()),
})

export type HandoffReportPayload = z.infer<typeof handoffReportSchema>

export const handoffReportPatchSchema = handoffReportSchema.partial()

export const prepareHandoffBodySchema = z.object({
  targetAgentId: z.string().trim().min(1),
  sourceAgentId: z.string().trim().min(1).optional(),
  threadId: z.string().trim().min(1).optional(),
  lastMessageId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1).optional(),
  maxTokens: z.number().int().min(100).max(4000).optional(),
  task: z.string().trim().min(1).optional(),
  done: optionalStringListSchema,
  nextSteps: optionalStringListSchema,
  constraints: optionalStringListSchema,
  artifacts: optionalStringListSchema,
  openQuestions: optionalStringListSchema,
  riskNotes: optionalStringListSchema,
  report: handoffReportPatchSchema.optional(),
  messages: z.array(copilotHandoffMessageSchema).max(80).default([]),
})

export type PrepareHandoffBody = z.infer<typeof prepareHandoffBodySchema>

export const handoffMetadataPayloadSchema = z.object({
  schemaVersion: z.literal(HANDOFF_SCHEMA_VERSION),
  handoffId: z.string().trim().min(1),
  sourceAgentId: z.string().trim().min(1),
  targetAgentId: z.string().trim().min(1),
  threadId: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  reason: z.string().trim().min(1).nullable(),
  report: handoffReportSchema,
})

export type HandoffMetadataPayload = z.infer<typeof handoffMetadataPayloadSchema>

export const prepareHandoffDataSchema = z.object({
  metadata: handoffMetadataPayloadSchema,
  handoffDocument: z.string().trim().min(1),
  droppedMessageCount: z.number().int().min(0),
  truncateBeforeMessageId: z.string().trim().min(1).nullable(),
})

export type PrepareHandoffData = z.infer<typeof prepareHandoffDataSchema>

export const prepareHandoffResponseSchema = apiSuccessSchema(
  prepareHandoffDataSchema
)

export const copilotHandoffContracts = {
  prepare: {
    bodySchema: prepareHandoffBodySchema,
    responseSchema: prepareHandoffResponseSchema,
  },
} as const
