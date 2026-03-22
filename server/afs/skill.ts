import { and, desc, eq, isNull, or, sql } from "drizzle-orm"

import { db } from "@/server/core/database"
import { afsSkill, type AfsScope, type AfsSkillRow } from "@/server/db/schema"

// ---------------------------------------------------------------------------
// Skill metadata (lightweight — no content field)
// ---------------------------------------------------------------------------

export interface SkillMeta {
  id: string
  agentId: string | null
  scope: string
  name: string
  description: string
  triggerWhen: string | null
  tags: string[]
  version: number
  isActive: boolean
  priority: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function rowToMeta(row: AfsSkillRow): SkillMeta {
  return {
    id: row.id,
    agentId: row.agentId,
    scope: row.scope,
    name: row.name,
    description: row.description,
    triggerWhen: row.triggerWhen,
    tags: row.tags ?? [],
    version: row.version,
    isActive: row.isActive,
    priority: row.priority,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function getAgentSpecificity(row: Pick<AfsSkillRow, "agentId">, requestedAgentId?: string): number {
  if (!requestedAgentId) {
    return row.agentId ? 0 : 1
  }

  if (row.agentId === requestedAgentId) return 2
  if (row.agentId === null) return 1
  return 0
}

function getScopeSpecificity(row: Pick<AfsSkillRow, "scope">, requestedScope?: AfsScope): number {
  if (!requestedScope) return 1
  if (row.scope === requestedScope) return 2
  if (row.scope === "Desktop") return 1
  return 0
}

function compareVisibleSkills(
  left: AfsSkillRow,
  right: AfsSkillRow,
  options?: { agentId?: string; scope?: AfsScope }
): number {
  const scopeDiff =
    getScopeSpecificity(right, options?.scope) -
    getScopeSpecificity(left, options?.scope)
  if (scopeDiff !== 0) return scopeDiff

  const agentDiff =
    getAgentSpecificity(right, options?.agentId) -
    getAgentSpecificity(left, options?.agentId)
  if (agentDiff !== 0) return agentDiff

  const priorityDiff = right.priority - left.priority
  if (priorityDiff !== 0) return priorityDiff

  return right.updatedAt.getTime() - left.updatedAt.getTime()
}

function resolveVisibleSkills(
  rows: AfsSkillRow[],
  options?: { agentId?: string; scope?: AfsScope }
): AfsSkillRow[] {
  const sorted = [...rows].sort((left, right) =>
    compareVisibleSkills(left, right, options)
  )

  const deduped = new Map<string, AfsSkillRow>()
  for (const row of sorted) {
    if (!deduped.has(row.name)) {
      deduped.set(row.name, row)
    }
  }

  return [...deduped.values()]
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AfsSkillService {
  /**
   * List skill metadata (without content) for a given user.
   * Optionally filter by agentId and/or scope. Only returns active skills.
   * Results include global skills (agentId IS NULL) and agent-specific skills.
   */
  async listSkillMeta(
    userId: string,
    options?: { agentId?: string; scope?: AfsScope }
  ): Promise<SkillMeta[]> {
    const conditions = [
      eq(afsSkill.userId, userId),
      eq(afsSkill.isActive, true),
    ]

    if (options?.agentId) {
      // Include both agent-specific and global skills
      conditions.push(
        or(
          eq(afsSkill.agentId, options.agentId),
          isNull(afsSkill.agentId)
        )!
      )
    }

    if (options?.scope) {
      if (options.scope === "Desktop") {
        // Desktop scope: only global skills
        conditions.push(eq(afsSkill.scope, "Desktop"))
      } else {
        // App scope: app-specific skills + Desktop global skills
        conditions.push(
          or(
            eq(afsSkill.scope, options.scope),
            eq(afsSkill.scope, "Desktop")
          )!
        )
      }
    }

    const rows = await db
      .select({
        id: afsSkill.id,
        userId: afsSkill.userId,
        agentId: afsSkill.agentId,
        scope: afsSkill.scope,
        name: afsSkill.name,
        description: afsSkill.description,
        triggerWhen: afsSkill.triggerWhen,
        tags: afsSkill.tags,
        version: afsSkill.version,
        isActive: afsSkill.isActive,
        priority: afsSkill.priority,
        metadata: afsSkill.metadata,
        createdAt: afsSkill.createdAt,
        updatedAt: afsSkill.updatedAt,
      })
      .from(afsSkill)
      .where(and(...conditions))
      .orderBy(desc(afsSkill.priority), desc(afsSkill.updatedAt))

    return resolveVisibleSkills(rows as unknown as AfsSkillRow[], options).map((row) =>
      rowToMeta(row)
    )
  }

  /**
   * Load full skill content by ID.
   */
  async loadSkillContent(skillId: string): Promise<{ content: string; name: string } | null> {
    const row = await db.query.afsSkill.findFirst({
      where: eq(afsSkill.id, skillId),
      columns: { id: true, name: true, content: true },
    })

    if (!row) return null
    return { content: row.content, name: row.name }
  }

  /**
   * Load full skill by name + userId (+ optional agentId).
   */
  async loadSkillByName(
    userId: string,
    name: string,
    agentId?: string | null,
    scope?: AfsScope
  ): Promise<AfsSkillRow | null> {
    const conditions = [
      eq(afsSkill.userId, userId),
      eq(afsSkill.name, name),
      eq(afsSkill.isActive, true),
    ]

    if (agentId) {
      conditions.push(
        or(eq(afsSkill.agentId, agentId), isNull(afsSkill.agentId))!
      )
    }

    if (scope) {
      if (scope === "Desktop") {
        conditions.push(eq(afsSkill.scope, "Desktop"))
      } else {
        conditions.push(
          or(
            eq(afsSkill.scope, scope),
            eq(afsSkill.scope, "Desktop")
          )!
        )
      }
    }

    const rows = await db
      .select()
      .from(afsSkill)
      .where(and(...conditions))

    const [resolved] = [...(rows as AfsSkillRow[])].sort((left, right) =>
      compareVisibleSkills(left, right, { agentId: agentId ?? undefined, scope })
    )

    return resolved ?? null
  }

  /**
   * Create or update a skill. Upserts based on the visible owner key:
   * (userId, scope, name, agentId|null).
   */
  async upsertSkill(
    userId: string,
    data: {
      agentId?: string | null
      scope?: AfsScope
      name: string
      description: string
      triggerWhen?: string | null
      tags?: string[]
      content: string
      priority?: number
      metadata?: Record<string, unknown>
    }
  ): Promise<AfsSkillRow> {
    const scope = data.scope ?? "Desktop"
    const existing = await db.query.afsSkill.findFirst({
      where: and(
        eq(afsSkill.userId, userId),
        data.agentId
          ? eq(afsSkill.agentId, data.agentId)
          : isNull(afsSkill.agentId),
        eq(afsSkill.scope, scope),
        eq(afsSkill.name, data.name)
      ),
    })

    if (existing) {
      const [updated] = await db
        .update(afsSkill)
        .set({
          description: data.description,
          triggerWhen: data.triggerWhen ?? existing.triggerWhen,
          tags: data.tags ?? existing.tags,
          content: data.content,
          scope,
          priority: data.priority ?? existing.priority,
          metadata: { ...(existing.metadata ?? {}), ...(data.metadata ?? {}) },
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(afsSkill.id, existing.id))
        .returning()

      return updated
    }

    const [created] = await db
      .insert(afsSkill)
      .values({
        userId,
        agentId: data.agentId ?? null,
        scope,
        name: data.name,
        description: data.description,
        triggerWhen: data.triggerWhen ?? null,
        tags: data.tags ?? [],
        content: data.content,
        priority: data.priority ?? 0,
        metadata: data.metadata ?? {},
      })
      .returning()

    return created
  }

  /**
   * Toggle skill active state.
   */
  async toggleSkill(skillId: string, isActive: boolean): Promise<boolean> {
    const result = await db
      .update(afsSkill)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(afsSkill.id, skillId))
      .returning()

    return result.length > 0
  }

  /**
   * Delete a skill permanently.
   */
  async deleteSkill(skillId: string): Promise<boolean> {
    const result = await db
      .delete(afsSkill)
      .where(eq(afsSkill.id, skillId))
      .returning()

    return result.length > 0
  }
}

export const afsSkillService = new AfsSkillService()
