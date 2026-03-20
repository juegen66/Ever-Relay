import { z } from "zod"

import { apiSuccessSchema } from "./common"

// ---------------------------------------------------------------------------
// AFS v2 node types
// Path protocol: Desktop/<scope>/Memory|History/<bucket>/<subpath>/<name>
// ---------------------------------------------------------------------------

export const AFS_SCOPES = ["Desktop", "Canvas", "Logo", "VibeCoding"] as const
export type AfsScope = (typeof AFS_SCOPES)[number]

export const AFS_KINDS = ["Memory", "History", "Skill"] as const
export type AfsKind = (typeof AFS_KINDS)[number]

export const AFS_MEMORY_BUCKETS = ["user", "note"] as const
export type AfsMemoryBucket = (typeof AFS_MEMORY_BUCKETS)[number]

export const AFS_HISTORY_BUCKETS = ["actions", "sessions", "prediction-runs", "workflow-runs", "canvas-activity"] as const
export type AfsHistoryBucket = (typeof AFS_HISTORY_BUCKETS)[number]

export const AFS_SOURCE_TYPES = ["prediction_agent", "workflow_curator", "manual", "system"] as const
export type AfsSourceType = (typeof AFS_SOURCE_TYPES)[number]

export const afsMetadataSchema = z.object({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
  confidence: z.number().optional(),
  sourceType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  accessCount: z.number().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().optional(),
  version: z.number().optional(),
}).passthrough()

export const afsNodeSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(["file", "dir"]),
  content: z.string().optional(),
  metadata: afsMetadataSchema,
})

export type AfsNode = z.infer<typeof afsNodeSchema>

// ---------------------------------------------------------------------------
// API: list
// ---------------------------------------------------------------------------

export const afsListQuerySchema = z.object({
  path: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export type AfsListQuery = z.infer<typeof afsListQuerySchema>

export const afsListResponseSchema = apiSuccessSchema(
  z.object({
    path: z.string(),
    nodes: z.array(afsNodeSchema),
  })
)

// ---------------------------------------------------------------------------
// API: read
// ---------------------------------------------------------------------------

export const afsReadQuerySchema = z.object({
  path: z.string().min(1),
})

export type AfsReadQuery = z.infer<typeof afsReadQuerySchema>

export const afsReadResponseSchema = apiSuccessSchema(afsNodeSchema)

// ---------------------------------------------------------------------------
// API: write
// ---------------------------------------------------------------------------

export const afsWriteBodySchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  sourceType: z.enum(AFS_SOURCE_TYPES).optional(),
})

export type AfsWriteBody = z.infer<typeof afsWriteBodySchema>

export const afsWriteResponseSchema = apiSuccessSchema(afsNodeSchema)

// ---------------------------------------------------------------------------
// API: search
// ---------------------------------------------------------------------------

export const afsSearchQuerySchema = z.object({
  query: z.string().min(1),
  mode: z.enum(["exact", "semantic"]).default("exact"),
  scope: z.string().optional(),
  pathPrefix: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.mode === "semantic" && !value.pathPrefix) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "pathPrefix is required when mode is semantic",
      path: ["pathPrefix"],
    })
  }
})

export type AfsSearchQuery = z.infer<typeof afsSearchQuerySchema>

export const afsSearchResponseSchema = apiSuccessSchema(
  z.object({
    results: z.array(afsNodeSchema),
  })
)

// ---------------------------------------------------------------------------
// API: delete
// ---------------------------------------------------------------------------

export const afsDeleteBodySchema = z.object({
  path: z.string().min(1),
})

export type AfsDeleteBody = z.infer<typeof afsDeleteBodySchema>

// ---------------------------------------------------------------------------
// Action log persistence
// ---------------------------------------------------------------------------

export const logActionBodySchema = z.object({
  actionType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().optional(),
})

export type LogActionBody = z.infer<typeof logActionBodySchema>

export const logActionBatchBodySchema = z.object({
  actions: z.array(
    z.object({
      actionType: z.string().min(1),
      payload: z.record(z.string(), z.unknown()).optional(),
      ts: z.number().optional(),
    })
  ).min(1).max(100),
  sessionId: z.string().optional(),
})

export type LogActionBatchBody = z.infer<typeof logActionBatchBodySchema>

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export const afsContracts = {
  list: {
    querySchema: afsListQuerySchema,
    responseSchema: afsListResponseSchema,
  },
  read: {
    querySchema: afsReadQuerySchema,
    responseSchema: afsReadResponseSchema,
  },
  write: {
    bodySchema: afsWriteBodySchema,
    responseSchema: afsWriteResponseSchema,
  },
  search: {
    querySchema: afsSearchQuerySchema,
    responseSchema: afsSearchResponseSchema,
  },
  delete: {
    bodySchema: afsDeleteBodySchema,
  },
  logAction: {
    bodySchema: logActionBodySchema,
  },
  logActionBatch: {
    bodySchema: logActionBatchBodySchema,
  },
} as const
