import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockUpdateChain() {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }
}

describe("read", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. reads memory node and returns AfsNode with content", async () => {
    const row = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "user",
      path: "/",
      name: "profile",
      content: "hello world",
      tags: [],
      confidence: 80,
      sourceType: "prediction_agent",
      accessCount: 5,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(row as never)
    const updateChain = mockUpdateChain()
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.read("u1", "Desktop/Memory/user/profile")

    expect(result).not.toBeNull()
    expect(result!.content).toBe("hello world")
    expect(result!.path).toContain("profile")
    expect(result!.metadata?.confidence).toBe(80)
  })

  it("2. increments accessCount on read", async () => {
    const row = {
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
      accessCount: 10,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(row as never)
    const updateChain = mockUpdateChain()
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    await afs.read("u1", "Desktop/Memory/user/profile")

    expect(db.update).toHaveBeenCalled()
    const setArg = updateChain.set.mock.calls[0][0]
    expect(setArg.accessCount).toBe(11)
  })

  it("3. returns null when node does not exist", async () => {
    vi.mocked(db.query.afsMemory.findFirst).mockResolvedValue(undefined)

    const result = await afs.read("u1", "Desktop/Memory/user/profile")

    expect(result).toBeNull()
  })

  it("4. returns null when path has no name", async () => {
    const result = await afs.read("u1", "Desktop/Memory/user")

    expect(result).toBeNull()
    expect(db.query.afsMemory.findFirst).not.toHaveBeenCalled()
  })

  it("5. returns null when path has no kind", async () => {
    const result = await afs.read("u1", "Desktop/Canvas")

    expect(result).toBeNull()
  })

  it("6. reads history node without updating accessCount", async () => {
    const row = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "actions",
      path: "/",
      name: "action-1",
      content: "history content",
      actionType: "click",
      status: "done",
      metadata: {},
      createdAt: new Date(),
    }
    vi.mocked(db.query.afsHistory.findFirst).mockResolvedValue(row as never)

    const result = await afs.read("u1", "Desktop/History/actions/action-1")

    expect(result).not.toBeNull()
    expect(result!.content).toBe("history content")
    expect(db.update).not.toHaveBeenCalled()
  })

  it("7. returns null when history node does not exist", async () => {
    vi.mocked(db.query.afsHistory.findFirst).mockResolvedValue(undefined)

    const result = await afs.read("u1", "Desktop/History/actions/missing")

    expect(result).toBeNull()
  })
})
