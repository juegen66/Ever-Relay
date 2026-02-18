"use client"

import { create } from "zustand"
import type { DesktopFolder, DesktopItemType } from "@/components/macos/desktop-icon"

const FILE_TYPE_DEFAULTS: Record<string, { name: string; itemType: DesktopItemType }> = {
  text: { name: "untitled.txt", itemType: "text" },
  image: { name: "untitled.png", itemType: "image" },
  code: { name: "untitled.js", itemType: "code" },
  spreadsheet: { name: "untitled.csv", itemType: "spreadsheet" },
  generic: { name: "untitled", itemType: "generic" },
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

interface DesktopItemsStore {
  desktopFolders: DesktopFolder[]
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  clearSelection: () => void
  createFolder: (x: number, y: number) => void
  createFile: (x: number, y: number, fileType: string) => void
  deleteItem: (id: string) => void
  renameItem: (id: string, name: string) => void
  moveItem: (id: string, x: number, y: number) => void
  moveIntoFolder: (itemId: string, targetFolderId: string) => void
  moveItemToDesktop: (itemId: string) => void
  createItemInFolder: (parentId: string, itemType: DesktopItemType, name: string) => void
}

export const useDesktopItemsStore = create<DesktopItemsStore>((set, get) => ({
  desktopFolders: [],
  selectedFolderId: null,
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  clearSelection: () => set({ selectedFolderId: null }),
  createFolder: (x, y) => {
    const id = `folder-${Date.now()}`
    const { width, height } = getViewportSize()
    const snappedX = Math.min(Math.max(x - 45, 20), width - 110)
    const snappedY = Math.min(Math.max(y - 40, 36), height - 140)
    set((state) => ({
      desktopFolders: [
        ...state.desktopFolders,
        {
          id,
          name: "untitled folder",
          x: snappedX,
          y: snappedY,
          isNew: true,
          itemType: "folder",
        },
      ],
      selectedFolderId: id,
    }))
  },
  createFile: (x, y, fileType) => {
    const id = `file-${Date.now()}`
    const { width, height } = getViewportSize()
    const snappedX = Math.min(Math.max(x - 45, 20), width - 110)
    const snappedY = Math.min(Math.max(y - 40, 36), height - 140)
    const defaults = FILE_TYPE_DEFAULTS[fileType] || FILE_TYPE_DEFAULTS.generic
    set((state) => ({
      desktopFolders: [
        ...state.desktopFolders,
        {
          id,
          name: defaults.name,
          x: snappedX,
          y: snappedY,
          isNew: true,
          itemType: defaults.itemType,
        },
      ],
      selectedFolderId: id,
    }))
  },
  deleteItem: (id) =>
    set((state) => ({
      desktopFolders: state.desktopFolders.filter((f) => f.id !== id),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    })),
  renameItem: (id, name) =>
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) =>
        f.id === id ? { ...f, name, isNew: false } : f
      ),
    })),
  moveItem: (id, x, y) =>
    set((state) => ({
      desktopFolders: state.desktopFolders.map((f) => (f.id === id ? { ...f, x, y } : f)),
    })),
  moveIntoFolder: (itemId, targetFolderId) =>
    set((state) => {
      const item = state.desktopFolders.find((f) => f.id === itemId)
      const target = state.desktopFolders.find((f) => f.id === targetFolderId)
      if (!item || !target || target.itemType !== "folder" || itemId === targetFolderId) {
        return {}
      }
      return {
        desktopFolders: state.desktopFolders.map((f) =>
          f.id === itemId ? { ...f, parentId: targetFolderId } : f
        ),
      }
    }),
  moveItemToDesktop: (itemId) =>
    set((state) => {
      const item = state.desktopFolders.find((f) => f.id === itemId)
      if (!item) return {}
      const baseX = 100 + Math.random() * 200
      const baseY = 100 + Math.random() * 200
      return {
        desktopFolders: state.desktopFolders.map((f) =>
          f.id === itemId ? { ...f, parentId: null, x: baseX, y: baseY } : f
        ),
      }
    }),
  createItemInFolder: (parentId, itemType, name) => {
    const id = `${itemType === "folder" ? "folder" : "file"}-${Date.now()}`
    set((state) => ({
      desktopFolders: [
        ...state.desktopFolders,
        {
          id,
          name,
          x: 0,
          y: 0,
          isNew: true,
          itemType,
          parentId,
        },
      ],
    }))
  },
}))
