import { and, desc, eq, isNull, sql } from "drizzle-orm"

import { afs } from "@/server/afs"
import { db } from "@/server/core/database"
import { afsMemory, afsHistory, type AfsScope, type AfsHistoryBucket } from "@/server/db/schema"
import type { AfsNode } from "@/server/afs/types"

export class AfsService {
  // ---- delegated file-system operations ----

  list(userId: string, path: string, limit?: number) {
    return afs.list(userId, path, { limit })
  }

  read(userId: string, path: string) {
    return afs.read(userId, path)
  }

  write(userId: string, path: string, content: string, options?: { tags?: string[]; confidence?: number; sourceType?: string }) {
    return afs.write(userId, path, content, options)
  }

  delete(userId: string, path: string) {
    return afs.delete(userId, path)
  }

  search(
    userId: string,
    query: string,
    options?: { mode?: "exact" | "semantic"; scope?: string; pathPrefix?: string; limit?: number }
  ) {
    return afs.search(userId, query, options)
  }

  // ---- namespace introspection ----

  getNamespaceTree() {
    return afs.getNamespaceTree()
  }

  getRecentTransactions(limit?: number) {
    return afs.getRecentTransactions(limit)
  }

  // ---- action log persistence ----

  async logAction(userId: string, actionType: string, payload: Record<string, unknown> = {}, sessionId?: string) {
    const name = `${actionType}-${Date.now()}`
    await afs.appendHistory(userId, "Desktop", "actions", name, JSON.stringify({ actionType, payload }), {
      actionType,
      metadata: { sessionId, payload },
    })
  }

  async logActionBatch(
    userId: string,
    actions: { actionType: string; payload?: Record<string, unknown>; ts?: number }[],
    sessionId?: string
  ) {
    if (actions.length === 0) return
    for (const a of actions) {
      const name = `${a.actionType}-${a.ts ?? Date.now()}`
      await afs.appendHistory(userId, "Desktop", "actions", name, JSON.stringify({ actionType: a.actionType, payload: a.payload ?? {} }), {
        actionType: a.actionType,
        metadata: { sessionId, payload: a.payload ?? {} },
      })
    }
  }

  // ---- prediction run log ----

  async logPredictionRun(
    userId: string,
    inputSnapshot: Record<string, unknown>,
    outputPredictions: Record<string, unknown>[],
    outputSuggestions: Record<string, unknown>[],
    durationMs?: number
  ) {
    const name = `run-${Date.now()}`
    const content = JSON.stringify({ inputSnapshot, outputPredictions, outputSuggestions, durationMs })
    const node = await afs.appendHistory(userId, "Desktop", "prediction-runs", name, content, {
      metadata: { durationMs },
    })
    return node
  }

  // ---- convenience: top memories for context injection ----

  async getTopMemories(userId: string, limit = 20): Promise<AfsNode[]> {
    const rows = await db
      .select()
      .from(afsMemory)
      .where(and(eq(afsMemory.userId, userId), isNull(afsMemory.deletedAt)))
      .orderBy(desc(afsMemory.confidence), desc(afsMemory.updatedAt))
      .limit(limit)

    return rows.map((r) => {
      const pathParts = ["Desktop"]
      if (r.scope !== "Desktop") pathParts.push(r.scope)
      pathParts.push("Memory", r.bucket)
      if (r.path && r.path !== "/") pathParts.push(...r.path.replace(/^\//, "").split("/"))
      pathParts.push(r.name)

      return {
        path: pathParts.join("/"),
        name: r.name,
        type: "file" as const,
        content: r.content,
        metadata: {
          confidence: r.confidence,
          sourceType: r.sourceType,
          tags: r.tags,
          accessCount: r.accessCount,
          scope: r.scope,
          bucket: r.bucket,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        },
      }
    })
  }

  // ---- lifecycle management ----

  async decayConfidence(daysInactive = 30, decayAmount = 10, minConfidence = 20) {
    const cutoff = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000)

    await db
      .update(afsMemory)
      .set({
        confidence: sql`GREATEST(0, ${afsMemory.confidence} - ${decayAmount})`,
        updatedAt: new Date(),
      })
      .where(
        and(
          isNull(afsMemory.deletedAt),
          sql`COALESCE(${afsMemory.lastAccessedAt}, ${afsMemory.createdAt}) < ${cutoff}`
        )
      )

    await db
      .update(afsMemory)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          isNull(afsMemory.deletedAt),
          sql`${afsMemory.confidence} < ${minConfidence}`
        )
      )
  }

  async cleanupExpired() {
    await db
      .update(afsMemory)
      .set({ deletedAt: new Date() })
      .where(
        and(
          isNull(afsMemory.deletedAt),
          sql`${afsMemory.expiresAt} IS NOT NULL AND ${afsMemory.expiresAt} < NOW()`
        )
      )
  }
}

export const afsService = new AfsService()
