"use client"

import type { CreateFileParams, FileItem } from "@/lib/api/modules/files"
import type { DesktopFolder, DesktopItemType } from "@/lib/desktop/types"

export const FILE_TYPE_DEFAULTS: Record<string, { name: string; itemType: DesktopItemType; mimeType: string }> = {
  text: { name: "untitled.txt", itemType: "text", mimeType: "text/plain" },
  image: { name: "untitled.png", itemType: "image", mimeType: "image/png" },
  code: { name: "untitled.js", itemType: "code", mimeType: "text/javascript" },
  spreadsheet: { name: "untitled.csv", itemType: "spreadsheet", mimeType: "text/csv" },
  generic: { name: "untitled", itemType: "generic", mimeType: "application/octet-stream" },
}

export function toDesktopFolder(item: FileItem, isNew = false): DesktopFolder {
  return {
    id: item.id,
    name: item.name,
    x: item.x,
    y: item.y,
    itemType: item.itemType as DesktopItemType,
    parentId: item.parentId,
    isNew,
  }
}

export function toDesktopItemType(value: string | undefined): DesktopItemType {
  if (value && value in FILE_TYPE_DEFAULTS) {
    return FILE_TYPE_DEFAULTS[value].itemType
  }
  return "generic"
}

export function resolveFileTypeDefaults(fileType: string): {
  name: string
  itemType: DesktopItemType
  mimeType: string
} {
  return FILE_TYPE_DEFAULTS[fileType] || FILE_TYPE_DEFAULTS.generic
}

export function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function snapToViewport(x: number, y: number) {
  const { width, height } = getViewportSize()
  return {
    x: Math.min(Math.max(x - 45, 20), width - 110),
    y: Math.min(Math.max(y - 40, 36), height - 140),
  }
}

export function getDefaultDesktopPosition() {
  if (typeof window === "undefined") {
    return { x: 180, y: 140 }
  }

  return {
    x: Math.max(80, Math.round(window.innerWidth * 0.22)),
    y: Math.max(90, Math.round(window.innerHeight * 0.22)),
  }
}

export function buildCreateFileParams({
  name,
  itemType,
  parentId,
  x,
  y,
}: {
  name: string
  itemType: DesktopItemType
  parentId?: string | null
  x: number
  y: number
}): CreateFileParams {
  const defaults = FILE_TYPE_DEFAULTS[itemType] || FILE_TYPE_DEFAULTS.generic

  if (itemType === "folder") {
    return {
      name,
      itemType,
      parentId,
      x,
      y,
    }
  }

  return {
    name,
    itemType,
    parentId,
    x,
    y,
    content: "",
    fileSize: 0,
    mimeType: defaults.mimeType,
  }
}
