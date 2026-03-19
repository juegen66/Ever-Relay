import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm"
import { z } from "zod"

import { afs } from "@/server/afs"
import { afsEmbeddingService } from "@/server/afs/embeddings"
import { db } from "@/server/core/database"
import {
  afsHistory,
  afsIngestCheckpoints,
  afsMemory,
  type AfsHistoryBucket,
  type AfsScope,
} from "@/server/db/schema"
import { memoryCuratorAgent } from "@/server/mastra/agents/shared/memory-curator-agent"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"

type AfsHistoryRow = typeof afsHistory.$inferSelect
type AfsCheckpointRow = typeof afsIngestCheckpoints.$inferSelect
type AfsMemoryRow = typeof afsMemory.$inferSelect

const HISTORY_BATCH_LIMIT = 50
const MAX_BATCHES_PER_RUN = 5

const historyDistillationSchema = z.object({
  note: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    confidence: z.number().int().min(1).max(100).optional(),
    tags: z.array(z.string().min(1)).optional(),
  }).nullable().optional(),
  userMemories: z.array(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    confidence: z.number().int().min(1).max(100).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })).default([]),
})

type HistoryDistillation = z.infer<typeof historyDistillationSchema>

interface IngestMemorySpec {
  scope: AfsScope
  bucket: "note" | "user"
  path: string
  name: string
  content: string
  confidence: number
  tags: string[]
  metadata: Record<string, unknown>
}

interface IngestBatchResult {
  historyCount: number
  memoriesWritten: number
  embeddingsUpdated: number
  noteMemories: number
  userMemories: number
  lastHistoryId: string
  lastHistoryCreatedAt: string
}

export interface AfsMemoryIngestResult {
  userId: string
  historyCount: number
  memoriesWritten: number
  embeddingsUpdated: number
  noteMemories: number
  userMemories: number
  batchesProcessed: number
  hasMore: boolean
  checkpoint: {
    lastHistoryId: string | null
    lastHistoryCreatedAt: string | null
  }
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "memory"
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function parseJsonObjectLoose(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const attempts = [trimmed]
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) {
    attempts.push(trimmed.slice(start, end + 1))
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      continue
    }
  }

  return null
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function fullMemoryPath(scope: AfsScope, bucket: "note" | "user", path: string, name: string) {
  const parts = ["Desktop"]
  if (scope !== "Desktop") parts.push(scope)
  parts.push("Memory", bucket)
  if (path !== "/") {
    parts.push(...path.replace(/^\/+/, "").split("/").filter(Boolean))
  }
  parts.push(name)
  return parts.join("/")
}

export class AfsIngestService {
  async listUsersNeedingIngest(limit = 50): Promise<string[]> {
    const result = await db.execute(sql<{ userId: string }>`
      select distinct h.user_id as "userId"
      from afs_history h
      left join afs_ingest_checkpoints c on c.user_id = h.user_id
      where c.user_id is null
        or c.last_history_created_at is null
        or h.created_at > c.last_history_created_at
        or (
          h.created_at = c.last_history_created_at
          and (
            c.last_history_id is null
            or h.id > c.last_history_id
          )
        )
      order by "userId"
      limit ${limit}
    `)

    return result.rows
      .map((row) => row.userId)
      .filter((userId): userId is string => typeof userId === "string" && userId.trim().length > 0)
  }

  async ingestUserHistory(userId: string): Promise<AfsMemoryIngestResult> {
    let checkpoint = await this.getCheckpoint(userId)
    await this.upsertCheckpoint(userId, {
      status: "running",
      error: null,
      lastRunAt: new Date(),
      metadata: {
        lastAttemptAt: new Date().toISOString(),
      },
    })

    let historyCount = 0
    let memoriesWritten = 0
    let embeddingsUpdated = 0
    let noteMemories = 0
    let userMemories = 0
    let batchesProcessed = 0
    let hasMore = false

    try {
      for (let batchIndex = 0; batchIndex < MAX_BATCHES_PER_RUN; batchIndex++) {
        const batch = await this.getPendingHistoryBatch(userId, checkpoint, HISTORY_BATCH_LIMIT)
        if (batch.length === 0) {
          hasMore = false
          break
        }

        const batchResult = await this.processBatch(userId, batch)
        const lastHistory = batch[batch.length - 1]!

        historyCount += batchResult.historyCount
        memoriesWritten += batchResult.memoriesWritten
        embeddingsUpdated += batchResult.embeddingsUpdated
        noteMemories += batchResult.noteMemories
        userMemories += batchResult.userMemories
        batchesProcessed++

        checkpoint = await this.upsertCheckpoint(userId, {
          status: "running",
          error: null,
          lastIngestedAt: new Date(),
          lastHistoryCreatedAt: lastHistory.createdAt,
          lastHistoryId: lastHistory.id,
          lastRunAt: new Date(),
          metadata: {
            lastBatchHistoryCount: batchResult.historyCount,
            lastBatchAt: new Date().toISOString(),
          },
        })

        hasMore = batch.length === HISTORY_BATCH_LIMIT
        if (!hasMore) {
          break
        }
      }

      checkpoint = await this.upsertCheckpoint(userId, {
        status: "completed",
        error: null,
        lastRunAt: new Date(),
        metadata: {
          batchesProcessed,
          historyCount,
          memoriesWritten,
          embeddingsUpdated,
          noteMemories,
          userMemories,
          hasMore,
        },
      })

      return {
        userId,
        historyCount,
        memoriesWritten,
        embeddingsUpdated,
        noteMemories,
        userMemories,
        batchesProcessed,
        hasMore,
        checkpoint: {
          lastHistoryId: checkpoint?.lastHistoryId ?? null,
          lastHistoryCreatedAt: checkpoint?.lastHistoryCreatedAt?.toISOString() ?? null,
        },
      }
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : "AFS memory ingest failed"

      await this.upsertCheckpoint(userId, {
        status: "failed",
        error: message,
        lastRunAt: new Date(),
        metadata: {
          batchesProcessed,
          historyCount,
          memoriesWritten,
          embeddingsUpdated,
          failedAt: new Date().toISOString(),
        },
      })
      throw error
    }
  }

  private async processBatch(userId: string, rows: AfsHistoryRow[]): Promise<IngestBatchResult> {
    const groups = this.groupHistoryRows(rows)
    const specs: IngestMemorySpec[] = []

    for (const group of groups) {
      const distillation = await this.distillHistoryGroup(userId, group.scope, group.bucket, group.rows)
      specs.push(...this.buildMemorySpecs(group.scope, group.bucket, group.rows, distillation))
    }

    const dedupedSpecs = this.dedupeSpecs(specs)
    const persistedRows: AfsMemoryRow[] = []
    let memoriesWritten = 0

    for (const spec of dedupedSpecs) {
      const persisted = await this.persistMemorySpec(userId, spec)
      persistedRows.push(persisted.row)
      if (persisted.changed) {
        memoriesWritten++
      }
    }

    let embeddingsUpdated = 0
    if (afsEmbeddingService.isEnabled()) {
      for (const row of persistedRows) {
        const updated = await afsEmbeddingService.upsertMemoryEmbedding(row)
        if (updated) {
          embeddingsUpdated++
        }
      }
    }

    const lastHistory = rows[rows.length - 1]!

    return {
      historyCount: rows.length,
      memoriesWritten,
      embeddingsUpdated,
      noteMemories: dedupedSpecs.filter((spec) => spec.bucket === "note").length,
      userMemories: dedupedSpecs.filter((spec) => spec.bucket === "user").length,
      lastHistoryId: lastHistory.id,
      lastHistoryCreatedAt: lastHistory.createdAt.toISOString(),
    }
  }

  private async distillHistoryGroup(
    userId: string,
    scope: AfsScope,
    bucket: AfsHistoryBucket,
    rows: AfsHistoryRow[]
  ): Promise<HistoryDistillation> {
    const first = rows[0]!
    const last = rows[rows.length - 1]!
    const transcript = rows
      .map((row) => this.formatHistoryRow(row))
      .join("\n\n")

    const prompt = [
      "You are distilling AFS history into memory for one user.",
      "Return JSON only with this exact shape:",
      '{"note":{"title":"string","summary":"string","confidence":75,"tags":["string"]},"userMemories":[{"title":"string","content":"string","confidence":88,"tags":["string"]}]}',
      "Rules:",
      "- note is optional and should summarize this batch as one episodic note.",
      "- userMemories should be empty unless the history clearly implies a durable preference, recurring habit, or stable fact.",
      "- Do not create more than 3 userMemories.",
      "- Do not mention history IDs or raw timestamps unless necessary for meaning.",
      "- Keep note summaries concise but specific.",
      "- userMemories must read as standalone durable memories.",
      `Scope: ${scope}`,
      `History bucket: ${bucket}`,
      `Entries: ${rows.length}`,
      `Window start: ${first.createdAt.toISOString()}`,
      `Window end: ${last.createdAt.toISOString()}`,
      "",
      "--- History ---",
      transcript,
      "--- End history ---",
    ].join("\n")

    const output = await memoryCuratorAgent.generate(prompt, {
      requestContext: createBuildRunRequestContext({
        userId,
        runId: `afs-ingest-${last.id}`,
      }),
      toolChoice: "none",
    })

    const parsed = parseJsonObjectLoose(output.text ?? "")
    if (!parsed) {
      throw new Error(`AFS ingest distillation returned invalid JSON for ${scope}/${bucket}`)
    }

    return historyDistillationSchema.parse(parsed)
  }

  private buildMemorySpecs(
    scope: AfsScope,
    bucket: AfsHistoryBucket,
    rows: AfsHistoryRow[],
    distillation: HistoryDistillation
  ): IngestMemorySpec[] {
    const specs: IngestMemorySpec[] = []
    const first = rows[0]!
    const last = rows[rows.length - 1]!
    const dateKey = formatDateKey(last.createdAt)

    if (distillation.note?.summary?.trim()) {
      const title = distillation.note.title.trim()
      const name = `${dateKey}-${slugify(title)}-${last.id.slice(0, 8)}`
      const sourceKey = `${scope}:${bucket}:${first.id}:${last.id}:note`
      specs.push({
        scope,
        bucket: "note",
        path: `/ingest/${bucket}/${dateKey}`,
        name,
        content: `${title}\n\n${distillation.note.summary.trim()}`,
        confidence: distillation.note.confidence ?? 72,
        tags: uniqueStrings([
          "ingest-note",
          bucket,
          ...(distillation.note.tags ?? []),
        ]),
        metadata: {
          ingest: {
            sourceKey,
            kind: "note",
            sourceBucket: bucket,
            firstHistoryId: first.id,
            lastHistoryId: last.id,
            firstHistoryCreatedAt: first.createdAt.toISOString(),
            lastHistoryCreatedAt: last.createdAt.toISOString(),
            historyCount: rows.length,
          },
        },
      })
    }

    for (const userMemory of distillation.userMemories.slice(0, 3)) {
      const title = userMemory.title.trim()
      const name = slugify(title)
      const sourceKey = `${scope}:${bucket}:${first.id}:${last.id}:user:${name}`
      specs.push({
        scope,
        bucket: "user",
        path: "/ingest",
        name,
        content: userMemory.content.trim(),
        confidence: userMemory.confidence ?? 86,
        tags: uniqueStrings([
          "ingest-user-memory",
          bucket,
          ...(userMemory.tags ?? []),
        ]),
        metadata: {
          ingest: {
            sourceKey,
            kind: "user",
            sourceBucket: bucket,
            firstHistoryId: first.id,
            lastHistoryId: last.id,
            firstHistoryCreatedAt: first.createdAt.toISOString(),
            lastHistoryCreatedAt: last.createdAt.toISOString(),
            historyCount: rows.length,
          },
        },
      })
    }

    return specs
  }

  private dedupeSpecs(specs: IngestMemorySpec[]) {
    const byKey = new Map<string, IngestMemorySpec>()
    for (const spec of specs) {
      byKey.set(`${spec.scope}:${spec.bucket}:${spec.path}:${spec.name}`, spec)
    }
    return Array.from(byKey.values())
  }

  private async persistMemorySpec(userId: string, spec: IngestMemorySpec) {
    const existing = await this.findMemoryRow(userId, spec.scope, spec.bucket, spec.path, spec.name)
    const sourceKey = this.getSourceKey(spec.metadata)

    if (
      existing &&
      sourceKey &&
      this.getSourceKey(existing.metadata) === sourceKey &&
      existing.content.trim() === spec.content.trim()
    ) {
      return { row: existing, changed: false }
    }

    await afs.write(userId, fullMemoryPath(spec.scope, spec.bucket, spec.path, spec.name), spec.content, {
      confidence: spec.confidence,
      tags: spec.tags,
      sourceType: "system",
      metadata: spec.metadata,
    })

    const persisted = await this.findMemoryRow(userId, spec.scope, spec.bucket, spec.path, spec.name)
    if (!persisted) {
      throw new Error(`AFS ingest failed to persist memory ${spec.name}`)
    }

    return { row: persisted, changed: true }
  }

  private async getPendingHistoryBatch(
    userId: string,
    checkpoint: AfsCheckpointRow | null,
    limit: number
  ) {
    const conditions = [eq(afsHistory.userId, userId)]

    if (checkpoint?.lastHistoryCreatedAt) {
      const cursorCondition = checkpoint.lastHistoryId
        ? or(
          gt(afsHistory.createdAt, checkpoint.lastHistoryCreatedAt),
          and(
            eq(afsHistory.createdAt, checkpoint.lastHistoryCreatedAt),
            gt(afsHistory.id, checkpoint.lastHistoryId)
          )
        )
        : gt(afsHistory.createdAt, checkpoint.lastHistoryCreatedAt)

      if (cursorCondition) {
        conditions.push(cursorCondition)
      }
    }

    return db
      .select()
      .from(afsHistory)
      .where(and(...conditions))
      .orderBy(asc(afsHistory.createdAt), asc(afsHistory.id))
      .limit(limit)
  }

  private groupHistoryRows(rows: AfsHistoryRow[]) {
    const groups = new Map<string, { scope: AfsScope; bucket: AfsHistoryBucket; rows: AfsHistoryRow[] }>()
    for (const row of rows) {
      const key = `${row.scope}:${row.bucket}`
      const existing = groups.get(key)
      if (existing) {
        existing.rows.push(row)
        continue
      }
      groups.set(key, {
        scope: row.scope,
        bucket: row.bucket,
        rows: [row],
      })
    }
    return Array.from(groups.values())
  }

  private formatHistoryRow(row: AfsHistoryRow) {
    const header = [
      row.createdAt.toISOString(),
      `scope=${row.scope}`,
      `bucket=${row.bucket}`,
      row.actionType ? `action=${row.actionType}` : null,
      row.status ? `status=${row.status}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    let content = row.content.trim()
    const parsedContent = parseJsonObjectLoose(content)
    if (parsedContent) {
      content = JSON.stringify(parsedContent)
    }
    if (content.length > 600) {
      content = `${content.slice(0, 600)}...`
    }

    const metadata = asRecord(row.metadata)
    const metadataText = metadata && Object.keys(metadata).length > 0
      ? `\nMetadata: ${JSON.stringify(metadata)}`
      : ""

    return `${header}\n${content}${metadataText}`
  }

  private getSourceKey(metadata: Record<string, unknown> | null | undefined) {
    const ingest = asRecord(metadata)?.ingest
    const sourceKey = asRecord(ingest)?.sourceKey
    return typeof sourceKey === "string" ? sourceKey : null
  }

  private async findMemoryRow(
    userId: string,
    scope: AfsScope,
    bucket: "note" | "user",
    path: string,
    name: string
  ) {
    return db.query.afsMemory.findFirst({
      where: and(
        eq(afsMemory.userId, userId),
        eq(afsMemory.scope, scope),
        eq(afsMemory.bucket, bucket),
        eq(afsMemory.path, path),
        eq(afsMemory.name, name),
        isNull(afsMemory.deletedAt)
      ),
    })
  }

  private async getCheckpoint(userId: string) {
    const checkpoint = await db.query.afsIngestCheckpoints.findFirst({
      where: eq(afsIngestCheckpoints.userId, userId),
    })
    return checkpoint ?? null
  }

  private async upsertCheckpoint(
    userId: string,
    updates: Partial<Omit<AfsCheckpointRow, "userId" | "createdAt">>
  ) {
    const existing = await this.getCheckpoint(userId)
    const nextMetadata = {
      ...(existing?.metadata ?? {}),
      ...(updates.metadata ?? {}),
    }

    if (existing) {
      const [checkpoint] = await db
        .update(afsIngestCheckpoints)
        .set({
          ...(updates.lastIngestedAt !== undefined ? { lastIngestedAt: updates.lastIngestedAt } : {}),
          ...(updates.lastHistoryCreatedAt !== undefined ? { lastHistoryCreatedAt: updates.lastHistoryCreatedAt } : {}),
          ...(updates.lastHistoryId !== undefined ? { lastHistoryId: updates.lastHistoryId } : {}),
          ...(updates.lastRunAt !== undefined ? { lastRunAt: updates.lastRunAt } : {}),
          ...(updates.status !== undefined ? { status: updates.status } : {}),
          ...(updates.error !== undefined ? { error: updates.error } : {}),
          metadata: nextMetadata,
          updatedAt: new Date(),
        })
        .where(eq(afsIngestCheckpoints.userId, userId))
        .returning()

      if (!checkpoint) {
        throw new Error(`AFS ingest failed to update checkpoint for ${userId}`)
      }
      return checkpoint
    }

    const [checkpoint] = await db
      .insert(afsIngestCheckpoints)
      .values({
        userId,
        lastIngestedAt: updates.lastIngestedAt ?? null,
        lastHistoryCreatedAt: updates.lastHistoryCreatedAt ?? null,
        lastHistoryId: updates.lastHistoryId ?? null,
        lastRunAt: updates.lastRunAt ?? null,
        status: updates.status ?? "idle",
        error: updates.error ?? null,
        metadata: nextMetadata,
      })
      .returning()

    if (!checkpoint) {
      throw new Error(`AFS ingest failed to create checkpoint for ${userId}`)
    }
    return checkpoint
  }
}

export const afsIngestService = new AfsIngestService()
