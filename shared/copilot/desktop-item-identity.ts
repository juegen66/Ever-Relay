export interface DesktopItemIdentityLike {
  name: string
  itemType?: string | null
  parentId?: string | null
}

export function normalizeDesktopItemName(name: string) {
  return name.trim()
}

export function normalizeDesktopItemParentId(parentId?: string | null) {
  const trimmed = typeof parentId === "string" ? parentId.trim() : ""
  return trimmed ? trimmed : null
}

export function normalizeDesktopItemIdentity<T extends DesktopItemIdentityLike>(item: T) {
  return {
    name: normalizeDesktopItemName(item.name),
    itemType: item.itemType ?? "generic",
    parentId: normalizeDesktopItemParentId(item.parentId),
  }
}

export function matchesDesktopItemIdentity(
  left: DesktopItemIdentityLike,
  right: DesktopItemIdentityLike
) {
  const normalizedLeft = normalizeDesktopItemIdentity(left)
  const normalizedRight = normalizeDesktopItemIdentity(right)

  return (
    normalizedLeft.name === normalizedRight.name &&
    normalizedLeft.itemType === normalizedRight.itemType &&
    normalizedLeft.parentId === normalizedRight.parentId
  )
}

export function findMatchingDesktopItem<T extends DesktopItemIdentityLike>(
  items: T[],
  target: DesktopItemIdentityLike
) {
  return items.find((item) => matchesDesktopItemIdentity(item, target)) ?? null
}
