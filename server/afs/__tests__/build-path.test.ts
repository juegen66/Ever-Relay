import { describe, it, expect, beforeEach } from "vitest"
import { AFS } from "../afs"

describe("buildPath", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
  })

  it("1. Desktop scope + memory", () => {
    const parsed = {
      scope: "Desktop",
      kind: "memory",
      bucket: "user",
      subpath: "/",
      name: "profile",
      depth: 4,
    }
    expect(afs.buildPath(parsed)).toBe("Desktop/Memory/user/profile")
  })

  it("2. Sub-app scope - Desktop/Canvas/Memory/user/profile", () => {
    const parsed = {
      scope: "Canvas",
      kind: "memory",
      bucket: "user",
      subpath: "/",
      name: "profile",
      depth: 4,
    }
    expect(afs.buildPath(parsed)).toBe("Desktop/Canvas/Memory/user/profile")
  })

  it("3. with subpath", () => {
    const parsed = {
      scope: "Desktop",
      kind: "memory",
      bucket: "note",
      subpath: "/projects/alpha",
      name: "summary",
      depth: 4,
    }
    expect(afs.buildPath(parsed)).toBe("Desktop/Memory/note/projects/alpha/summary")
  })

  it("4. scope only", () => {
    const parsed = {
      scope: "Canvas",
      kind: null,
      bucket: null,
      subpath: "/",
      name: null,
      depth: 1,
    }
    expect(afs.buildPath(parsed)).toBe("Desktop/Canvas")
  })

  it("5. parsePath -> buildPath roundtrip consistency", () => {
    const paths = [
      "Desktop/Memory/user/profile",
      "Desktop/Canvas/Memory/user/profile",
      "Desktop/Memory/note/projects/alpha/summary",
      "Desktop/Canvas",
      "Desktop/History/actions",
    ]
    for (const path of paths) {
      const parsed = afs.parsePath(path)
      const rebuilt = afs.buildPath(parsed)
      expect(rebuilt).toBe(path)
    }
  })
})
