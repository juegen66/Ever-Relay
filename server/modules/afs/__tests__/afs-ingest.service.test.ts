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

describe("AfsIngestService.ingestUserHistory", () => {
  let service: AfsIngestService

  beforeEach(() => {
    service = new AfsIngestService()
    vi.clearAllMocks()
  })

  it("aggregates batch results and completes the checkpoint", async () => {
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

    vi.spyOn(service as never, "getCheckpoint").mockResolvedValueOnce(null)

    const upsertCheckpoint = vi.spyOn(service as never, "upsertCheckpoint")
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
        status: "completed",
        error: null,
        metadata: {},
        createdAt: new Date("2026-03-18T01:05:00.000Z"),
        updatedAt: new Date("2026-03-18T01:11:00.000Z"),
      })

    vi.spyOn(service as never, "getPendingHistoryBatch")
      .mockResolvedValueOnce(batchRows)
      .mockResolvedValueOnce([])

    vi.spyOn(service as never, "processBatch").mockResolvedValue({
      historyCount: 1,
      memoriesWritten: 2,
      embeddingsUpdated: 2,
      noteMemories: 1,
      userMemories: 1,
      lastHistoryId: batchRows[0]!.id,
      lastHistoryCreatedAt: batchRows[0]!.createdAt.toISOString(),
    })

    const result = await service.ingestUserHistory("u1")

    expect(result).toMatchObject({
      userId: "u1",
      historyCount: 1,
      memoriesWritten: 2,
      embeddingsUpdated: 2,
      noteMemories: 1,
      userMemories: 1,
      batchesProcessed: 1,
      hasMore: false,
      checkpoint: {
        lastHistoryId: batchRows[0]!.id,
      },
    })
    expect(upsertCheckpoint).toHaveBeenCalledTimes(3)
  })

  it("marks the checkpoint failed when a batch throws", async () => {
    const error = new Error("distillation failed")

    vi.spyOn(service as never, "getCheckpoint").mockResolvedValueOnce(null)
    const upsertCheckpoint = vi.spyOn(service as never, "upsertCheckpoint")
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

    vi.spyOn(service as never, "getPendingHistoryBatch").mockResolvedValueOnce([
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
    vi.spyOn(service as never, "processBatch").mockRejectedValue(error)

    await expect(service.ingestUserHistory("u1")).rejects.toThrow(error.message)
    expect(upsertCheckpoint).toHaveBeenLastCalledWith("u1", expect.objectContaining({
      status: "failed",
      error: error.message,
    }))
  })
})
