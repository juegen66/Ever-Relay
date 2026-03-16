import { describe, it, expect, beforeEach } from "vitest"
import { AFS } from "../afs"

describe("getNamespaceTree", () => {
  let afs: AFS

  beforeEach(() => {
    afs = new AFS()
  })

  it("1. returns non-empty string with Desktop and scopes", () => {
    const tree = afs.getNamespaceTree()

    expect(tree).toContain("Desktop/")
    expect(tree).toContain("Canvas/")
    expect(tree).toContain("Memory/")
    expect(tree).toContain("History/")
    expect(tree).toContain("user/")
    expect(tree).toContain("note/")
    expect(tree.length).toBeGreaterThan(0)
  })

  it("2. contains Memory and History branches", () => {
    const tree = afs.getNamespaceTree()

    expect(tree).toContain("Memory/")
    expect(tree).toContain("History/")
    expect(tree).toContain("actions/")
    expect(tree).toContain("sessions/")
  })
})
