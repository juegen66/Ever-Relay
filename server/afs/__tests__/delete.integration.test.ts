import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { AFS } from "../afs"
import { db } from "@/server/core/database"
import { afsMemory } from "@/server/db/schema"
import { eq } from "drizzle-orm"

const TEST_USER = "integration-test-delete"

describe("delete (integration)", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
  })

  afterEach(async () => {
    await db.delete(afsMemory).where(eq(afsMemory.userId, TEST_USER))
  })

  it("1. deletes existing memory node and returns true", async () => {
    await afs.write(TEST_USER, "Desktop/Memory/user/profile", "hello")
    const result = await afs.delete(TEST_USER, "Desktop/Memory/user/profile")
    expect(result).toBe(true)

    const after = await afs.read(TEST_USER, "Desktop/Memory/user/profile")
    expect(after).toBeNull()
  })

  it("2. returns false when node does not exist", async () => {
    const result = await afs.delete(TEST_USER, "Desktop/Memory/user/nonexistent")
    expect(result).toBe(false)
  })

  it("3. throws when deleting History path", async () => {
    await expect(afs.delete(TEST_USER, "Desktop/History/actions/x")).rejects.toThrow(
      "only Memory is deletable"
    )
  })

  it("4. returns false when path has no name", async () => {
    const result = await afs.delete(TEST_USER, "Desktop/Memory/user")
    expect(result).toBe(false)
  })

  it("5. uses soft delete - read returns null for deleted node", async () => {
    await afs.write(TEST_USER, "Desktop/Memory/user/soft-delete-test", "content")
    await afs.delete(TEST_USER, "Desktop/Memory/user/soft-delete-test")

    const after = await afs.read(TEST_USER, "Desktop/Memory/user/soft-delete-test")
    expect(after).toBeNull()
  })
})
