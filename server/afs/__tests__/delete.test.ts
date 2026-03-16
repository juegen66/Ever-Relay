import { describe, it, expect, beforeEach, vi } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"

function mockUpdateChain(rows: unknown[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
}

describe("delete", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
    vi.clearAllMocks()
  })

  it("1. deletes existing memory node and returns true", async () => {
    const updateChain = mockUpdateChain([{ id: "id-1" }])
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.delete("u1", "Desktop/Memory/user/profile")

    expect(result).toBe(true)
    expect(db.update).toHaveBeenCalled()
    const setArg = updateChain.set.mock.calls[0][0]
    expect(setArg.deletedAt).toBeInstanceOf(Date)
  })

  it("2. returns false when node does not exist", async () => {
    const updateChain = mockUpdateChain([])
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await afs.delete("u1", "Desktop/Memory/user/profile")

    expect(result).toBe(false)
  })

  it("3. throws when deleting History path", async () => {
    await expect(afs.delete("u1", "Desktop/History/actions/x")).rejects.toThrow(
      "only Memory is deletable"
    )
    expect(db.update).not.toHaveBeenCalled()
  })

  it("4. returns false when path has no name", async () => {
    const result = await afs.delete("u1", "Desktop/Memory/user")

    expect(result).toBe(false)
    expect(db.update).not.toHaveBeenCalled()
  })

  it("5. uses soft delete with deletedAt", async () => {
    const updateChain = mockUpdateChain([{ id: "id-1" }])
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    await afs.delete("u1", "Desktop/Memory/user/profile")

    const setArg = updateChain.set.mock.calls[0][0]
    expect(setArg).toHaveProperty("deletedAt")
    expect(setArg.deletedAt).toBeInstanceOf(Date)
  })
})
