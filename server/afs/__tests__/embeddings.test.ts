import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/core/database", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}))

import { AfsEmbeddingService } from "@/server/afs/embeddings"
import { db } from "@/server/core/database"

function mockSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

describe("AfsEmbeddingService.upsertMemoryEmbedding", () => {
  let service: AfsEmbeddingService

  beforeEach(() => {
    service = new AfsEmbeddingService()
    vi.clearAllMocks()
  })

  it("skips re-embedding when the stored hash is fresh", async () => {
    const memory = {
      id: "m1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "User prefers concise summaries.",
      contentType: null,
      tags: [],
      confidence: 90,
      sourceType: "system",
      accessCount: 0,
      lastAccessedAt: null,
      expiresAt: null,
      deletedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const contentHash = service.hashContent(memory.content)
    vi.mocked(db.select).mockReturnValue(mockSelectChain([{
      memoryId: memory.id,
      contentHash,
      staleAt: null,
    }]) as never)
    const embedSpy = vi.spyOn(service, "embedText")

    const changed = await service.upsertMemoryEmbedding(memory)

    expect(changed).toBe(false)
    expect(embedSpy).not.toHaveBeenCalled()
  })
})
