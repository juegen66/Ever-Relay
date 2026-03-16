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

describe("list", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. depth 0: lists root with scopes + Memory + History", async () => {
    const result = await afs.list("u1", "")

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((n) => n.name === "Memory" && n.type === "dir")).toBe(true)
    expect(result.some((n) => n.name === "History" && n.type === "dir")).toBe(true)
    expect(result.some((n) => n.name === "Canvas")).toBe(true)
    expect(db.select).not.toHaveBeenCalled()
  })

  it("2. depth 1: lists kinds under scope", async () => {
    const result = await afs.list("u1", "Desktop/Canvas")

    expect(result).toHaveLength(2)
    expect(result.map((n) => n.name)).toContain("Memory")
    expect(result.map((n) => n.name)).toContain("History")
    expect(db.select).not.toHaveBeenCalled()
  })

  it("3. depth 2: lists Memory buckets", async () => {
    const result = await afs.list("u1", "Desktop/Memory")

    expect(result.map((n) => n.name)).toContain("user")
    expect(result.map((n) => n.name)).toContain("note")
    expect(db.select).not.toHaveBeenCalled()
  })

  it("4. depth 2: lists History buckets", async () => {
    const result = await afs.list("u1", "Desktop/History")

    expect(result.length).toBe(5)
    expect(result.map((n) => n.name)).toContain("actions")
    expect(result.map((n) => n.name)).toContain("sessions")
    expect(db.select).not.toHaveBeenCalled()
  })

  it("5. depth 3: lists memory bucket content from DB", async () => {
    const rows = [
      {
        id: "id-1",
        userId: "u1",
        scope: "Desktop",
        bucket: "user",
        path: "/",
        name: "profile",
        content: "x",
        tags: [],
        confidence: 80,
        sourceType: "prediction_agent",
        accessCount: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    const selectChain = mockSelectChain(rows)
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    const result = await afs.list("u1", "Desktop/Memory/user")

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("file")
    expect(result[0].name).toBe("profile")
    expect(db.select).toHaveBeenCalled()
    expect(selectChain.limit).toHaveBeenCalledWith(50)
  })

  it("6. depth 3: lists history bucket content from DB", async () => {
    const rows = [
      {
        id: "id-1",
        userId: "u1",
        scope: "Desktop",
        bucket: "actions",
        path: "/",
        name: "act-1",
        content: "x",
        metadata: {},
        createdAt: new Date(),
      },
    ]
    const selectChain = mockSelectChain(rows)
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    const result = await afs.list("u1", "Desktop/History/actions")

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("file")
  })

  it("7. empty result when DB returns []", async () => {
    const selectChain = mockSelectChain([])
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    const result = await afs.list("u1", "Desktop/Memory/user")

    expect(result).toEqual([])
  })

  it("8. limit option is passed to query", async () => {
    const selectChain = mockSelectChain([])
    vi.mocked(db.select).mockReturnValue(selectChain as never)

    await afs.list("u1", "Desktop/Memory/user", { limit: 10 })

    expect(selectChain.limit).toHaveBeenCalledWith(10)
  })
})
