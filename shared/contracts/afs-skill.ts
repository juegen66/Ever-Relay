import { z } from "zod"

import { apiSuccessSchema } from "./common"
import { AFS_SCOPES } from "./afs"

// ---------------------------------------------------------------------------
// AFS Skill schemas
// ---------------------------------------------------------------------------

export const afsSkillMetaSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().nullable(),
  scope: z.string(),
  name: z.string(),
  description: z.string(),
  triggerWhen: z.string().nullable(),
  tags: z.array(z.string()),
  version: z.number().int(),
  isActive: z.boolean(),
  priority: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type AfsSkillMeta = z.infer<typeof afsSkillMetaSchema>

export const afsSkillFullSchema = afsSkillMetaSchema.extend({
  content: z.string(),
})

export type AfsSkillFull = z.infer<typeof afsSkillFullSchema>

// ---------------------------------------------------------------------------
// API: list skill metadata
// ---------------------------------------------------------------------------

export const afsSkillListQuerySchema = z.object({
  agentId: z.string().optional(),
  scope: z.enum(AFS_SCOPES).optional(),
})

export type AfsSkillListQuery = z.infer<typeof afsSkillListQuerySchema>

export const afsSkillListResponseSchema = apiSuccessSchema(
  z.object({
    skills: z.array(afsSkillMetaSchema),
  })
)

// ---------------------------------------------------------------------------
// API: load skill content
// ---------------------------------------------------------------------------

export const afsSkillLoadQuerySchema = z.object({
  skillId: z.string().uuid(),
})

export type AfsSkillLoadQuery = z.infer<typeof afsSkillLoadQuerySchema>

export const afsSkillLoadResponseSchema = apiSuccessSchema(
  z.object({
    name: z.string(),
    content: z.string(),
  })
)

// ---------------------------------------------------------------------------
// API: upsert skill
// ---------------------------------------------------------------------------

export const afsSkillUpsertBodySchema = z.object({
  agentId: z.string().nullable().optional(),
  scope: z.enum(AFS_SCOPES).optional(),
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(1024),
  triggerWhen: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().min(1),
  priority: z.number().int().min(0).max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AfsSkillUpsertBody = z.infer<typeof afsSkillUpsertBodySchema>

export const afsSkillUpsertResponseSchema = apiSuccessSchema(afsSkillFullSchema)

// ---------------------------------------------------------------------------
// API: toggle skill
// ---------------------------------------------------------------------------

export const afsSkillToggleBodySchema = z.object({
  skillId: z.string().uuid(),
  isActive: z.boolean(),
})

export type AfsSkillToggleBody = z.infer<typeof afsSkillToggleBodySchema>

// ---------------------------------------------------------------------------
// API: delete skill
// ---------------------------------------------------------------------------

export const afsSkillDeleteBodySchema = z.object({
  skillId: z.string().uuid(),
})

export type AfsSkillDeleteBody = z.infer<typeof afsSkillDeleteBodySchema>

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export const afsSkillContracts = {
  list: {
    querySchema: afsSkillListQuerySchema,
    responseSchema: afsSkillListResponseSchema,
  },
  load: {
    querySchema: afsSkillLoadQuerySchema,
    responseSchema: afsSkillLoadResponseSchema,
  },
  upsert: {
    bodySchema: afsSkillUpsertBodySchema,
    responseSchema: afsSkillUpsertResponseSchema,
  },
  toggle: {
    bodySchema: afsSkillToggleBodySchema,
  },
  delete: {
    bodySchema: afsSkillDeleteBodySchema,
  },
} as const
