"use client"

import { create } from "zustand"
import type { DesktopFolder, DesktopItemType } from "@/app/desktop/components/macos/desktop-icon"
import { filesApi, type FileItem } from "@/lib/api/modules/files"

const FILE_TYPE_DEFAULTS: Record<string, { name: string; itemType: DesktopItemType; mimeType: string }> = {
  text: { name: "untitled.txt", itemType: "text", mimeType: "text/plain" },
  image: { name: "untitled.png", itemType: "image", mimeType: "image/png" },
  code: { name: "untitled.js", itemType: "code", mimeType: "text/javascript" },
  spreadsheet: { name: "untitled.csv", itemType: "spreadsheet", mimeType: "text/csv" },
  generic: { name: "untitled", itemType: "generic", mimeType: "application/octet-stream" },
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

function toDesktopFolder(item: FileItem, isNew = false): DesktopFolder {
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

function snapToViewport(x: number, y: number) {
  const { width, height } = getViewportSize()
  return {
    x: Math.min(Math.max(x - 45, 20), width - 110),
    y: Math.min(Math.max(y - 40, 36), height - 140),
  }
}

interface DesktopItemsStore {
  desktopFolders: DesktopFolder[]
  selectedFolderId: string | null
  loading: boolean
  error: string | null
  setSelectedFolderId: (id: string | null) => void
  clearSelection: () => void
  fetchItems: () => Promise<void>
  createFolder: (x: number, y: number) => Promise<void>
  createFile: (x: number, y: number, fileType: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  renameItem: (id: string, name: string) => Promise<void>
  moveItem: (id: string, x: number, y: number) => Promise<void>
  persistItemPosition: (id: string, x: number, y: number) => Promise<void>
  moveIntoFolder: (itemId: string, targetFolderId: string) => Promise<void>
  moveItemToDesktop: (itemId: string) => Promise<void>
  createItemInFolder: (parentId: string, itemType: DesktopItemType, name: string) => Promise<void>
}

export const useDesktopItemsStore = create<DesktopItemsStore>((set, get) => ({
  desktopFolders: [],
  selectedFolderId: null,
  loading: false,
  error: null,

  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  clearSelection: () => set({ selectedFolderId: null }),

  fetchItems: async () => {
    set({ loading: true, error: null })
    try {
      const items = await filesApi.list()
      set({ desktopFolders: items.map((i) => toDesktopFolder(i)), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createFolder: async (x, y) => {
    const snapped = snapToViewport(x, y)
    try {
      const item = await filesApi.create({
        name: "untitled folder",
        itemType: "folder",
        x: snapped.x,
        y: snapped.y,
      })
      const newItem = toDesktopFolder(item, true)
      set((state) => ({
        desktopFolders: [...state.desktopFolders, newItem],
        selectedFolderId: newItem.id,
      }))
    } catch (err) {
      console.error("Failed to create folder:", err)
    }
  },

  createFile: async (x, y, fileType) => {
    const snapped = snapToViewport(x, y)
    const defaults = FILE_TYPE_DEFAULTS[fileType] || FILE_TYPE_DEFAULTS.generic

    try {
      const item = await filesApi.create({
        name: defaults.name,
        itemType: defaults.itemType,
        x: snapped.x,
        y: snapped.y,
        content: "",
        fileSize: 0,
        mimeType: defaults.mimeType,
      })
      const newItem = toDesktopFolder(item, true)
      set((state) => ({
        desktopFolders: [...state.desktopFolders, newItem],
        selectedFolderId: newItem.id,
      }))
    } catch (err) {
      console.error("Failed to create file:", err)
    }
  },

  deleteItem: async (id) => {
    try {
      await filesApi.remove(id)
      set((state) => ({
        desktopFolders: state.desktopFolders.filter((f) => f.id !== id && f.parentId !== id),
        selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
      }))
    } catch (err) {
      console.error("Failed to delete item:", err)
    }
  },

  renameItem: async (id, name) => {
    // Optimistic update
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) =>
        f.id === id ? { ...f, name, isNew: false } : f
      ),
    }))

    try {
      await filesApi.update(id, { name })
    } catch (err) {
      console.error("Failed to rename item:", err)
    }
  },

  moveItem: async (id, x, y) => {
    // Optimistic local update for smooth dragging.
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) => (f.id === id ? { ...f, x, y } : f)),
    }))
  },

  persistItemPosition: async (id, x, y) => {
    if (get().error === "Session expired. Please sign in again.") {
      return
    }

    try {
      await filesApi.update(id, { x, y })
    } catch (err) {
      console.error("Failed to persist item position:", err)
    }
  },

  moveIntoFolder: async (itemId, targetFolderId) => {
    const state = get()
    const item = state.desktopFolders.find((f) => f.id === itemId)
    const target = state.desktopFolders.find((f) => f.id === targetFolderId)
    if (!item || !target || target.itemType !== "folder" || itemId === targetFolderId) {
      return
    }

    // Optimistic update
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) =>
        f.id === itemId ? { ...f, parentId: targetFolderId } : f
      ),
    }))

    try {
      await filesApi.update(itemId, { parentId: targetFolderId })
    } catch (err) {
      console.error("Failed to move item into folder:", err)
    }
  },

  moveItemToDesktop: async (itemId) => {
    const state = get()
    const item = state.desktopFolders.find((f) => f.id === itemId)
    if (!item) return

    const baseX = 100 + Math.random() * 200
    const baseY = 100 + Math.random() * 200

    // Optimistic update
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) =>
        f.id === itemId ? { ...f, parentId: null, x: baseX, y: baseY } : f
      ),
    }))

    try {
      await filesApi.update(itemId, { parentId: null, x: baseX, y: baseY })
    } catch (err) {
      console.error("Failed to move item to desktop:", err)
    }
  },

  createItemInFolder: async (parentId, itemType, name) => {
    try {
      const defaults = FILE_TYPE_DEFAULTS[itemType] || FILE_TYPE_DEFAULTS.generic

      const item = await filesApi.create({
        name,
        itemType,
        parentId,
        x: 0,
        y: 0,
        content: itemType !== "folder" ? "" : undefined,
        fileSize: itemType !== "folder" ? 0 : undefined,
        mimeType: itemType !== "folder" ? defaults.mimeType : undefined,
      })
      const newItem = toDesktopFolder(item, true)
      set((state) => ({
        desktopFolders: [...state.desktopFolders, newItem],
      }))
    } catch (err) {
      console.error("Failed to create item in folder:", err)
    }
  },
}))
