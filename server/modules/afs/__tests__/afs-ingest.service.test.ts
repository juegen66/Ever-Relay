import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/afs", () => ({
  afs: {},
}))

vi.mock("@/server/afs/embeddings", () => ({
  afsEmbeddingService: {
    isEnabled: vi.fn(() => false),
    upsertMemoryEmbedding: vi.fn(),
  },
}))

vi.mock("@/server/core/database", () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    query: {
      afsIngestCheckpoints: {
        findFirst: vi.fn(),
      },
      afsMemory: {
        findFirst: vi.fn(),
      },
    },
  },
}))

vi.mock("@/server/mastra/agents/shared/memory-curator-agent", () => ({
  memoryCuratorAgent: {
    generate: vi.fn(),
  },
}))

import { AfsIngestService } from "@/server/modules/afs/afs-ingest.service"
import { afsEmbeddingService } from "@/server/afs/embeddings"

describe("AfsIngestService", () => {
  let service: AfsIngestService

  beforeEach(() => {
    service = new AfsIngestService()
    vi.clearAllMocks()
  })

  it("aggregates history-to-memory results and returns changed memory ids", async () => {
    const batchRows = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        userId: "u1",
        scope: "Desktop",
        bucket: "actions",
        path: "/",
        name: "a1",
        actionType: "click",
        content: "clicked save",
        status: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
      },
    ]

    vi.spyOn(service as any, "getCheckpoint").mockResolvedValueOnce(null)

    const upsertCheckpoint = vi.spyOn(service as any, "upsertCheckpoint")
    upsertCheckpoint
      .mockResolvedValueOnce({
        userId: "u1",
        lastIngestedAt: null,
        lastHistoryCreatedAt: null,
        lastHistoryId: null,
        lastRunAt: new Date("2026-03-18T01:05:00.000Z"),
        status: "running",
        error: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:05:00.000Z"),
      })
      .mockResolvedValueOnce({
        userId: "u1",
        lastIngestedAt: new Date("2026-03-18T01:10:00.000Z"),
        lastHistoryCreatedAt: batchRows[0]!.createdAt,
        lastHistoryId: batchRows[0]!.id,
        lastRunAt: new Date("2026-03-18T01:10:00.000Z"),
        status: "running",
        error: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:10:00.000Z"),
      })
      .mockResolvedValueOnce({
        userId: "u1",
        lastIngestedAt: new Date("2026-03-18T01:10:00.000Z"),
        lastHistoryCreatedAt: batchRows[0]!.createdAt,
        lastHistoryId: batchRows[0]!.id,
        lastRunAt: new Date("2026-03-18T01:11:00.000Z"),
        status: "running",
        error: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:11:00.000Z"),
      })

    vi.spyOn(service as any, "getPendingHistoryBatch")
      .mockResolvedValueOnce(batchRows)
      .mockResolvedValueOnce([])

    vi.spyOn(service as any, "processBatch").mockResolvedValue({
      historyCount: 1,
      memoriesWritten: 2,
      noteMemories: 1,
      userMemories: 1,
      changedMemoryIds: ["m1", "m2"],
      lastHistoryId: batchRows[0]!.id,
      lastHistoryCreatedAt: batchRows[0]!.createdAt.toISOString(),
    })

    const result = await service.ingestHistoryToMemory("u1")

    expect(result).toMatchObject({
      userId: "u1",
      historyCount: 1,
      memoriesWritten: 2,
      noteMemories: 1,
      userMemories: 1,
      batchesProcessed: 1,
      hasMore: false,
      changedMemoryIds: ["m1", "m2"],
      checkpoint: {
        lastHistoryId: batchRows[0]!.id,
      },
    })
    expect(upsertCheckpoint).toHaveBeenCalledTimes(3)
    expect(upsertCheckpoint).toHaveBeenLastCalledWith("u1", expect.objectContaining({
      status: "running",
      metadata: expect.objectContaining({
        phase: "history_to_memory_completed",
        changedMemoryCount: 2,
      }),
    }))
  })

  it("marks the checkpoint failed when a batch throws", async () => {
    const error = new Error("distillation failed")

    vi.spyOn(service as any, "getCheckpoint").mockResolvedValueOnce(null)
    const upsertCheckpoint = vi.spyOn(service as any, "upsertCheckpoint")
    upsertCheckpoint
      .mockResolvedValueOnce({
        userId: "u1",
        lastIngestedAt: null,
        lastHistoryCreatedAt: null,
        lastHistoryId: null,
        lastRunAt: new Date("2026-03-18T01:05:00.000Z"),
        status: "running",
        error: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:05:00.000Z"),
      })
      .mockResolvedValueOnce({
        userId: "u1",
        lastIngestedAt: null,
        lastHistoryCreatedAt: null,
        lastHistoryId: null,
        lastRunAt: new Date("2026-03-18T01:06:00.000Z"),
        status: "failed",
        error: error.message,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:06:00.000Z"),
      })

    vi.spyOn(service as any, "getPendingHistoryBatch").mockResolvedValueOnce([
      {
        id: "00000000-0000-0000-0000-000000000001",
        userId: "u1",
        scope: "Desktop",
        bucket: "actions",
        path: "/",
        name: "a1",
        actionType: "click",
        content: "clicked save",
        status: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
      },
    ])
    vi.spyOn(service as any, "processBatch").mockRejectedValue(error)

    await expect(service.ingestHistoryToMemory("u1")).rejects.toThrow(error.message)
    expect(upsertCheckpoint).toHaveBeenLastCalledWith("u1", expect.objectContaining({
      status: "failed",
      error: error.message,
    }))
  })

  it("embeds only the changed memories from step one and completes the checkpoint", async () => {
    const changedRows = [
      {
        id: "m1",
        userId: "u1",
        scope: "Desktop",
        bucket: "note",
        path: "/ingest/actions/2026-03-18",
        name: "existing-note",
        content: "Existing note",
        contentType: null,
        tags: ["ingest-note"],
        confidence: 72,
        sourceType: "system",
        accessCount: 0,
        lastAccessedAt: null,
        expiresAt: null,
        deletedAt: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
        updatedAt: new Date("2026-03-18T01:00:00.000Z"),
      },
      {
        id: "m2",
        userId: "u1",
        scope: "Desktop",
        bucket: "user",
        path: "/ingest",
        name: "prefers-save",
        content: "User prefers saving frequently.",
        contentType: null,
        tags: ["ingest-user-memory"],
        confidence: 86,
        sourceType: "system",
        accessCount: 0,
        lastAccessedAt: null,
        expiresAt: null,
        deletedAt: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
        updatedAt: new Date("2026-03-18T01:00:00.000Z"),
      },
    ]

    const historyToMemoryResult = {
      userId: "u1",
      historyCount: 1,
      memoriesWritten: 2,
      noteMemories: 1,
      userMemories: 1,
      batchesProcessed: 1,
      hasMore: false,
      checkpoint: {
        lastHistoryId: "00000000-0000-0000-0000-000000000001",
        lastHistoryCreatedAt: "2026-03-18T01:00:00.000Z",
      },
      changedMemoryIds: ["m1", "m2"],
    }

    vi.mocked(afsEmbeddingService.isEnabled).mockReturnValue(true)
    vi.mocked(afsEmbeddingService.upsertMemoryEmbedding)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    vi.spyOn(service as any, "getMemoryRowsByIds").mockResolvedValue(changedRows)
    const upsertCheckpoint = vi.spyOn(service as any, "upsertCheckpoint").mockResolvedValue({
      userId: "u1",
      lastIngestedAt: new Date("2026-03-18T01:10:00.000Z"),
      lastHistoryCreatedAt: new Date("2026-03-18T01:00:00.000Z"),
      lastHistoryId: "00000000-0000-0000-0000-000000000001",
      lastRunAt: new Date("2026-03-18T01:11:00.000Z"),
      status: "completed",
      error: null,
      metadata: {},
      createdAt: new Date("2026-03-18T01:05:00.000Z"),
      updatedAt: new Date("2026-03-18T01:11:00.000Z"),
    })

    const result = await service.embedChangedMemories(historyToMemoryResult)

    expect(afsEmbeddingService.upsertMemoryEmbedding).toHaveBeenCalledTimes(2)
    expect(afsEmbeddingService.upsertMemoryEmbedding).toHaveBeenNthCalledWith(1, changedRows[0])
    expect(afsEmbeddingService.upsertMemoryEmbedding).toHaveBeenNthCalledWith(2, changedRows[1])
    expect(result).toMatchObject({
      userId: "u1",
      historyCount: 1,
      memoriesWritten: 2,
      embeddingsUpdated: 1,
      noteMemories: 1,
      userMemories: 1,
    })
    expect(upsertCheckpoint).toHaveBeenCalledWith("u1", expect.objectContaining({
      status: "completed",
      metadata: expect.objectContaining({
        phase: "embedding_completed",
        changedMemoryCount: 2,
      }),
    }))
  })
})
