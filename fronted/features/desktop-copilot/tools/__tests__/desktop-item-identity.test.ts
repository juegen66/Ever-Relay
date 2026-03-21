import { describe, expect, it } from "vitest"

import {
  findMatchingDesktopItem,
  matchesDesktopItemIdentity,
  normalizeDesktopItemIdentity,
  normalizeDesktopItemParentId,
} from "@/shared/copilot/desktop-item-identity"

describe("desktop-item-identity", () => {
  it("normalizes trimmed names and empty parent ids", () => {
    expect(
      normalizeDesktopItemIdentity({
        name: "  dhai  ",
        itemType: "text",
        parentId: "   ",
      })
    ).toEqual({
      name: "dhai",
      itemType: "text",
      parentId: null,
    })
  })

  it("treats undefined, null, and blank parent ids the same", () => {
    expect(normalizeDesktopItemParentId(undefined)).toBeNull()
    expect(normalizeDesktopItemParentId(null)).toBeNull()
    expect(normalizeDesktopItemParentId("")).toBeNull()
    expect(normalizeDesktopItemParentId("   ")).toBeNull()
  })

  it("matches items by normalized name, type, and parent", () => {
    expect(
      matchesDesktopItemIdentity(
        { name: " dhai ", itemType: "text", parentId: undefined },
        { name: "dhai", itemType: "text", parentId: null }
      )
    ).toBe(true)
  })

  it("does not match different parents or types", () => {
    expect(
      matchesDesktopItemIdentity(
        { name: "dhai", itemType: "text", parentId: null },
        { name: "dhai", itemType: "code", parentId: null }
      )
    ).toBe(false)

    expect(
      matchesDesktopItemIdentity(
        { name: "dhai", itemType: "text", parentId: "folder-a" },
        { name: "dhai", itemType: "text", parentId: "folder-b" }
      )
    ).toBe(false)
  })

  it("finds the first matching item from a collection", () => {
    const items = [
      { id: "1", name: "bbol", itemType: "text", parentId: null },
      { id: "2", name: "dhai", itemType: "code", parentId: null },
      { id: "3", name: " dhai ", itemType: "text", parentId: undefined },
    ]

    expect(
      findMatchingDesktopItem(items, {
        name: "dhai",
        itemType: "text",
        parentId: null,
      })
    ).toEqual(items[2])
  })
})
