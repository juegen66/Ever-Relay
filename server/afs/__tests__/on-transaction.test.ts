import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockInsertChain(rows: unknown[]) {
  return {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
}

describe("onTransaction", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. sink is called on each operation", async () => {
    const sink = vi.fn()
    afs.onTransaction(sink)

    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([
      { id: "1", name: "x", content: "x", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    ])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user/x", "content")

    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink.mock.calls[0][0]).toMatchObject({
      operation: "write",
      path: "Desktop/Memory/user/x",
      actor: "u1",
    })
  })

  it("2. sink error does not affect main flow", async () => {
    const sink = vi.fn().mockRejectedValue(new Error("sink error"))
    afs.onTransaction(sink)

    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([
      { id: "1", name: "x", content: "content", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    ])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    const result = await afs.write("u1", "Desktop/Memory/user/x", "content")

    expect(result).toBeDefined()
    expect(result.content).toBe("content")
  })
})
