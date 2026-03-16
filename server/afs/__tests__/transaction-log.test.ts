import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockInsertChain(rows: unknown[]) {
  return {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
}

describe("getRecentTransactions", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. returns recent N transactions after writes", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([
      { id: "1", name: "x", content: "x", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    ])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user/a", "1")
    await afs.write("u1", "Desktop/Memory/user/b", "2")

    const txs = afs.getRecentTransactions(10)
    expect(txs.length).toBe(2)
    expect(txs.every((t) => t.operation === "write")).toBe(true)
  })

  it("2. default limit is 50", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([
      { id: "1", name: "x", content: "x", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    ])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user/x", "x")
    const txs = afs.getRecentTransactions()
    expect(txs.length).toBeLessThanOrEqual(50)
  })

  it("3. txLog is trimmed when exceeding 1000", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([
      { id: "1", name: "x", content: "x", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    ])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    for (let i = 0; i < 1100; i++) {
      await afs.write("u1", "Desktop/Memory/user/x", `content-${i}`)
    }

    const txs = afs.getRecentTransactions(2000)
    expect(txs.length).toBeLessThanOrEqual(1000)
  })
})
