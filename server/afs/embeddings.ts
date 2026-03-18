import { createHash } from "node:crypto"

import { eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import { serverConfig } from "@/server/core/config"
import { afsMemory, afsMemoryEmbeddings } from "@/server/db/schema"

type AfsMemoryRow = typeof afsMemory.$inferSelect

interface EmbeddingResponse {
  vector: number[]
  model: string
  modelVersion: string
}

export class AfsEmbeddingService {
  isEnabled() {
    return serverConfig.afsEmbedding.enabled
  }

  hashContent(content: string) {
    return createHash("sha256").update(content).digest("hex")
  }

  async embedText(text: string): Promise<EmbeddingResponse> {
    if (!this.isEnabled()) {
      throw new Error("AFS embedding provider is not configured")
    }

    const response = await fetch(`${serverConfig.afsEmbedding.baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${serverConfig.afsEmbedding.apiKey}`,
      },
      body: JSON.stringify({
        model: serverConfig.afsEmbedding.model,
        input: text,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`AFS embedding request failed (${response.status}): ${body || response.statusText}`)
    }

    const data = await response.json() as {
      data?: Array<{ embedding?: number[] }>
      model?: string
    }

    const vector = data.data?.[0]?.embedding
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("AFS embedding response did not include a vector")
    }
    if (vector.length !== serverConfig.afsEmbedding.dimensions) {
      throw new Error(
        `AFS embedding dimension mismatch: expected ${serverConfig.afsEmbedding.dimensions}, got ${vector.length}`
      )
    }

    return {
      vector,
      model: data.model ?? serverConfig.afsEmbedding.model,
      modelVersion: serverConfig.afsEmbedding.modelVersion,
    }
  }

  async upsertMemoryEmbedding(memory: AfsMemoryRow, embedding?: EmbeddingResponse) {
    const contentHash = this.hashContent(memory.content)
    const nextEmbedding = embedding ?? await this.embedText(memory.content)

    const existingRows = await db
      .select()
      .from(afsMemoryEmbeddings)
      .where(eq(afsMemoryEmbeddings.memoryId, memory.id))
      .limit(1)

    const values = {
      memoryId: memory.id,
      userId: memory.userId,
      embedding: nextEmbedding.vector,
      model: nextEmbedding.model,
      modelVersion: nextEmbedding.modelVersion,
      contentHash,
      indexedAt: new Date(),
      staleAt: null,
      metadata: {},
    }

    if (existingRows.length > 0) {
      await db
        .update(afsMemoryEmbeddings)
        .set(values)
        .where(eq(afsMemoryEmbeddings.memoryId, memory.id))
      return
    }

    await db
      .insert(afsMemoryEmbeddings)
      .values(values)
  }

  async markMemoryEmbeddingStale(memoryId: string) {
    await db
      .update(afsMemoryEmbeddings)
      .set({ staleAt: new Date() })
      .where(eq(afsMemoryEmbeddings.memoryId, memoryId))
  }
}

export const afsEmbeddingService = new AfsEmbeddingService()
