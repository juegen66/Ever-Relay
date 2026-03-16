import { describe, it, expect, beforeEach } from "vitest"
import { AFS } from "../afs"

describe("parsePath", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
  })

  it("1. empty path / root path returns depth 0", () => {
    const expected = { scope: "Desktop", kind: null, bucket: null, subpath: "/", name: null, depth: 0 }
    expect(afs.parsePath("")).toEqual(expected)
    expect(afs.parsePath("/")).toEqual(expected)
    expect(afs.parsePath("Desktop")).toEqual(expected)
  })

  it("2. scope level - Desktop/Canvas", () => {
    const result = afs.parsePath("Desktop/Canvas")
    expect(result.scope).toBe("Canvas")
    expect(result.kind).toBeNull()
    expect(result.depth).toBe(1)
  })

  it("3. kind level - Desktop/Canvas/Memory", () => {
    const result = afs.parsePath("Desktop/Canvas/Memory")
    expect(result.scope).toBe("Canvas")
    expect(result.kind).toBe("memory")
    expect(result.depth).toBe(2)
  })

  it("4. bucket level - Desktop/Memory/user", () => {
    const result = afs.parsePath("Desktop/Memory/user")
    expect(result.scope).toBe("Desktop")
    expect(result.kind).toBe("memory")
    expect(result.bucket).toBe("user")
    expect(result.depth).toBe(3)
  })

  it("5. full file path - Desktop/Canvas/Memory/user/profile", () => {
    const result = afs.parsePath("Desktop/Canvas/Memory/user/profile")
    expect(result.scope).toBe("Canvas")
    expect(result.kind).toBe("memory")
    expect(result.bucket).toBe("user")
    expect(result.name).toBe("profile")
    expect(result.depth).toBe(4)
  })

  it("6. with subpath - Desktop/Memory/note/projects/alpha/summary", () => {
    const result = afs.parsePath("Desktop/Memory/note/projects/alpha/summary")
    expect(result.subpath).toBe("/projects/alpha")
    expect(result.name).toBe("summary")
    expect(result.depth).toBe(4)
  })

  it("7. History path - Desktop/History/actions", () => {
    const result = afs.parsePath("Desktop/History/actions")
    expect(result.kind).toBe("history")
    expect(result.bucket).toBe("actions")
    expect(result.depth).toBe(3)
  })

  it("8. leading/trailing slashes are trimmed", () => {
    const result = afs.parsePath("/Desktop/Canvas/Memory/user/")
    expect(result.scope).toBe("Canvas")
    expect(result.kind).toBe("memory")
    expect(result.bucket).toBe("user")
    expect(result.depth).toBe(3)
  })

  it("9. invalid kind returns kind null", () => {
    const result = afs.parsePath("Desktop/Canvas/InvalidKind")
    expect(result.kind).toBeNull()
    expect(result.depth).toBe(1)
  })

  it("10. lowercase desktop prefix is stripped", () => {
    const result = afs.parsePath("desktop")
    expect(result.depth).toBe(0)
  })
})
