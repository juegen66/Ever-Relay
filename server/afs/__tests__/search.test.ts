import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

function mockUpdateChain() {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }
}

describe("search", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. merges memory + history results", async () => {
    const memRows = [
      {
        id: "m1",
        userId: "u1",
        scope: "Desktop",
        bucket: "user",
        path: "/",
        name: "profile",
        content: "hello world",
        tags: [],
        confidence: 80,
        sourceType: "prediction_agent",
        accessCount: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    const histRows = [
      {
        id: "h1",
        userId: "u1",
        scope: "Desktop",
        bucket: "actions",
        path: "/",
        name: "act1",
        content: "hello",
        metadata: {},
        createdAt: new Date(),
      },
    ]
    let callCount = 0
    vi.mocked(db.select).mockImplementation(() => {
      callCount++
      return mockSelectChain(callCount === 1 ? memRows : histRows) as never
    })
    const updateChain = mockUpdateChain()
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.search("u1", "hello")

    expect(result.length).toBe(2)
    expect(result.some((r) => r.content?.includes("hello world"))).toBe(true)
    expect(result.some((r) => r.content?.includes("hello"))).toBe(true)
  })

  it("2. returns empty array when no results", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as never)

    const result = await afs.search("u1", "nonexistent")

    expect(result).toEqual([])
  })

  it("3. scope filter is applied when options.scope provided", async () => {
    const selectChain = mockSelectChain([])
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    await afs.search("u1", "query", { scope: "Desktop/Canvas" })

    expect(db.select).toHaveBeenCalled()
    expect(selectChain.where).toHaveBeenCalled()
  })

  it("4. limit option is passed", async () => {
    const selectChain = mockSelectChain([])
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    await afs.search("u1", "q", { limit: 5 })

    expect(selectChain.limit).toHaveBeenCalledWith(5)
  })

  it("5. bumps accessCount for memory results", async () => {
    const memRows = [
      {
        id: "m1",
        userId: "u1",
        scope: "Desktop",
        bucket: "user",
        path: "/",
        name: "x",
        content: "q",
        tags: [],
        confidence: 80,
        sourceType: "prediction_agent",
        accessCount: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    vi.mocked(db.select).mockReturnValue(mockSelectChain(memRows) as never)
    const updateChain = mockUpdateChain()
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    await afs.search("u1", "q")

    expect(db.update).toHaveBeenCalled()
    expect(updateChain.where).toHaveBeenCalled()
  })

  it("6. records transaction with search operation", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as never)

    await afs.search("u1", "myquery")

    const txs = afs.getRecentTransactions(10)
    expect(txs.some((t) => t.operation === "search" && t.detail?.query === "myquery")).toBe(true)
  })
})
