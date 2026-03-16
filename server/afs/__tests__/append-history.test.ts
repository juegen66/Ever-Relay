import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockInsertChain(rows: unknown[]) {
  return {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
}

describe("appendHistory", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. appends and returns AfsNode", async () => {
    const row = {
      id: "id-1",
      userId: "u1",
      scope: "Desktop",
      bucket: "actions",
      path: "/",
      name: "act-1",
      content: "did something",
      metadata: {},
      createdAt: new Date(),
    }
    const insertChain = mockInsertChain([row])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    const result = await afs.appendHistory("u1", "Desktop", "actions", "act-1", "did something")

    expect(result.type).toBe("file")
    expect(result.content).toBe("did something")
    expect(result.path).toContain("act-1")
  })

  it("2. includes actionType/status/metadata in insert", async () => {
    const insertChain = mockInsertChain([{ id: "1", name: "x", content: "x", scope: "Desktop", bucket: "actions", path: "/", metadata: {}, createdAt: new Date() }])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.appendHistory("u1", "Canvas", "actions", "act-1", "content", {
      actionType: "click",
      status: "done",
      metadata: { key: "value" },
    })

    const valuesCall = insertChain.values.mock.calls[0][0]
    expect(valuesCall.actionType).toBe("click")
    expect(valuesCall.status).toBe("done")
    expect(valuesCall.metadata).toEqual({ key: "value" })
    expect(valuesCall.scope).toBe("Canvas")
  })

  it("3. default path is / when not provided", async () => {
    const row = {
      id: "1",
      userId: "u1",
      scope: "Desktop",
      bucket: "actions",
      path: "/",
      name: "x",
      content: "content",
      metadata: {},
      createdAt: new Date(),
    }
    const insertChain = mockInsertChain([row])
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    await afs.appendHistory("u1", "Desktop", "actions", "x", "content")

    const valuesCall = insertChain.values.mock.calls[0][0]
    expect(valuesCall.path).toBe("/")
  })
})
