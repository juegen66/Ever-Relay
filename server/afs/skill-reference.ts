import { and, desc, eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import {
  afsSkill,
  afsSkillReference,
  type AfsSkillReferenceContentFormat,
  type AfsSkillReferenceRow,
} from "@/server/db/schema"

export interface SkillReferenceMeta {
  id: string
  skillId: string
  userId: string
  name: string
  title: string
  description: string
  contentFormat: AfsSkillReferenceContentFormat
  loadWhen: string | null
  priority: number
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SkillReferenceContent extends SkillReferenceMeta {
  content: string
}

function rowToMeta(row: AfsSkillReferenceRow): SkillReferenceMeta {
  return {
    id: row.id,
    skillId: row.skillId,
    userId: row.userId,
    name: row.name,
    title: row.title,
    description: row.description,
    contentFormat: row.contentFormat,
    loadWhen: row.loadWhen,
    priority: row.priority,
    isActive: row.isActive,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class AfsSkillReferenceService {
  async listReferenceMeta(userId: string, skillId: string): Promise<SkillReferenceMeta[]> {
    const rows = await db
      .select()
      .from(afsSkillReference)
      .where(
        and(
          eq(afsSkillReference.userId, userId),
          eq(afsSkillReference.skillId, skillId),
          eq(afsSkillReference.isActive, true)
        )
      )
      .orderBy(desc(afsSkillReference.priority), desc(afsSkillReference.updatedAt))

    return rows.map((row) => rowToMeta(row as AfsSkillReferenceRow))
  }

  async loadReferenceContent(
    userId: string,
    referenceId: string
  ): Promise<SkillReferenceContent | null> {
    const row = await db.query.afsSkillReference.findFirst({
      where: and(
        eq(afsSkillReference.id, referenceId),
        eq(afsSkillReference.userId, userId),
        eq(afsSkillReference.isActive, true)
      ),
    })

    if (!row) return null

    return {
      ...rowToMeta(row),
      content: row.content,
    }
  }

  async loadReferenceByName(
    userId: string,
    skillId: string,
    name: string
  ): Promise<AfsSkillReferenceRow | null> {
    const row = await db.query.afsSkillReference.findFirst({
      where: and(
        eq(afsSkillReference.userId, userId),
        eq(afsSkillReference.skillId, skillId),
        eq(afsSkillReference.name, name),
        eq(afsSkillReference.isActive, true)
      ),
      orderBy: [desc(afsSkillReference.priority)],
    })

    return row ?? null
  }

  async upsertReference(
    userId: string,
    skillId: string,
    data: {
      name: string
      title: string
      description: string
      content: string
      contentFormat?: AfsSkillReferenceContentFormat
      loadWhen?: string | null
      priority?: number
      metadata?: Record<string, unknown>
    }
  ): Promise<AfsSkillReferenceRow> {
    const ownerSkill = await db.query.afsSkill.findFirst({
      where: and(
        eq(afsSkill.id, skillId),
        eq(afsSkill.userId, userId)
      ),
      columns: { id: true },
    })

    if (!ownerSkill) {
      throw new Error(`Skill not found or access denied: ${skillId}`)
    }

    const existing = await db.query.afsSkillReference.findFirst({
      where: and(
        eq(afsSkillReference.userId, userId),
        eq(afsSkillReference.skillId, skillId),
        eq(afsSkillReference.name, data.name)
      ),
    })

    if (existing) {
      const [updated] = await db
        .update(afsSkillReference)
        .set({
          title: data.title,
          description: data.description,
          content: data.content,
          contentFormat: data.contentFormat ?? existing.contentFormat,
          loadWhen: data.loadWhen ?? existing.loadWhen,
          priority: data.priority ?? existing.priority,
          metadata: { ...(existing.metadata ?? {}), ...(data.metadata ?? {}) },
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(afsSkillReference.id, existing.id))
        .returning()

      return updated
    }

    const [created] = await db
      .insert(afsSkillReference)
      .values({
        userId,
        skillId,
        name: data.name,
        title: data.title,
        description: data.description,
        content: data.content,
        contentFormat: data.contentFormat ?? "markdown",
        loadWhen: data.loadWhen ?? null,
        priority: data.priority ?? 0,
        metadata: data.metadata ?? {},
      })
      .returning()

    return created
  }

  async toggleReference(referenceId: string, isActive: boolean): Promise<boolean> {
    const result = await db
      .update(afsSkillReference)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(afsSkillReference.id, referenceId))
      .returning()

    return result.length > 0
  }

  async deleteReference(referenceId: string): Promise<boolean> {
    const result = await db
      .delete(afsSkillReference)
      .where(eq(afsSkillReference.id, referenceId))
      .returning()

    return result.length > 0
  }
}

export const afsSkillReferenceService = new AfsSkillReferenceService()
