import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockInsertChain(rows: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
  return chain
}

function mockUpdateChain(rows: unknown[]) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
  return chain
}

describe("write", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. creates new memory entry when findFirst returns null", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const newRow = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "hello",
      tags: [],
      confidence: 80,
      sourceType: "prediction_agent",
      accessCount: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const insertChain = mockInsertChain([newRow])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    const result = await afs.write("u1", "Desktop/Memory/user/profile", "hello")

    expect(result.path).toContain("profile")
    expect(result.content).toBe("hello")
    expect(result.metadata?.confidence).toBe(80)
    expect(db.query.afsMemory.findFirst).toHaveBeenCalled()
    expect(db.insert).toHaveBeenCalled()
  })

  it("2. dedup merge when findFirst returns existing row", async () => {
    const existing = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "old",
      tags: ["a"],
      confidence: 80,
      sourceType: "prediction_agent",
      accessCount: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(existing as never)
    const updated = { ...existing, content: "old\n---\nnew", confidence: 85, tags: ["a", "b"] }
    const updateChain = mockUpdateChain([updated])
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.write("u1", "Desktop/Memory/user/profile", "new", { tags: ["b"] })

    expect(result.content).toBe("old\n---\nnew")
    expect(result.metadata?.confidence).toBe(85)
    expect(db.update).toHaveBeenCalledTimes(2)
  })

  it("3. merge confidence capped at 100", async () => {
    const existing = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "old",
      tags: [],
      confidence: 98,
      sourceType: "prediction_agent",
      accessCount: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(existing as never)
    const updateChain = mockUpdateChain([{ ...existing, confidence: 100 }])
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.write("u1", "Desktop/Memory/user/profile", "new")

    expect(result.metadata?.confidence).toBe(100)
  })

  it("4. custom tags/confidence/sourceType in insert values", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const newRow = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "x",
      tags: ["tag1"],
      confidence: 90,
      sourceType: "manual",
      accessCount: 0,
      metadata: { k: "v" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const insertChain = mockInsertChain([newRow])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user/profile", "x", {
      tags: ["tag1"],
      confidence: 90,
      sourceType: "manual",
      metadata: { k: "v" },
    })

    expect(db.insert).toHaveBeenCalled()
    const valuesCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values.mock.calls[0][0]
    expect(valuesCall.tags).toEqual(["tag1"])
    expect(valuesCall.confidence).toBe(90)
    expect(valuesCall.sourceType).toBe("manual")
    expect(valuesCall.metadata).toEqual({ k: "v" })
  })

  it("5. name auto-slug from content when path has no name", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const newRow = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "hello-world",
      content: "Hello World!",
      tags: [],
      confidence: 80,
      sourceType: "prediction_agent",
      accessCount: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const insertChain = mockInsertChain([newRow])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user", "Hello World!")

    const valuesCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values.mock.calls[0][0]
    expect(valuesCall.name).toBe("hello-world")
  })

  it("6. throws when writing to History path", async () => {
    await expect(afs.write("u1", "Desktop/History/actions/x", "content")).rejects.toThrow(
      "only Memory is writable"
    )
    expect(db.query.afsMemory.findFirst).not.toHaveBeenCalled()
  })

  it("7. throws when invalid memory bucket", async () => {
    await expect(afs.write("u1", "Desktop/Memory/invalid-bucket/x", "content")).rejects.toThrow(
      "invalid memory bucket"
    )
  })

  it("8. records transaction with operation write", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)
    const insertChain = mockInsertChain([{ id: "1", name: "x", content: "x", scope: "Desktop", bucket: "user", path: "/", tags: [], confidence: 80, sourceType: "prediction_agent", metadata: {}, createdAt: new Date(), updatedAt: new Date() }])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.write("u1", "Desktop/Memory/user/x", "x")
    const txs = afs.getRecentTransactions(10)
    expect(txs.some((t) => t.operation === "write" && t.path === "Desktop/Memory/user/x")).toBe(true)
  })
})
