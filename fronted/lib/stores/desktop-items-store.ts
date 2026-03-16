"use client"

import { create } from "zustand"

import type { DesktopFolder, DesktopItemType } from "@/lib/desktop/types"
import {
  buildCreateFileParams,
  getDefaultDesktopPosition,
  resolveFileTypeDefaults,
  snapToViewport,
  toDesktopFolder,
} from "@/lib/desktop-items"
import { getQueryClient } from "@/lib/query/client"
import { getCachedFileItems } from "@/lib/query/files"
import {
  createDesktopItem,
  deleteDesktopItem,
  fetchDesktopItems,
  moveDesktopItemInCache,
  updateDesktopItem,
} from "@/lib/services/desktop-items-service"

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed"
}

interface DesktopItemsStore {
  desktopFolders: DesktopFolder[]
  selectedFolderId: string | null
  loading: boolean
  error: string | null
  pendingRenameItemIds: Record<string, true>
  setSelectedFolderId: (id: string | null) => void
  clearSelection: () => void
  markItemForRename: (id: string) => void
  clearItemRenameState: (id: string) => void
  fetchItems: () => Promise<void>
  createItem: (params: {
    name: string
    itemType: DesktopItemType
    parentId?: string
    x?: number
    y?: number
  }) => Promise<DesktopFolder | null>
  createFolder: (x: number, y: number) => Promise<void>
  createFile: (x: number, y: number, fileType: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  renameItem: (id: string, name: string) => Promise<void>
  moveItem: (id: string, x: number, y: number) => Promise<void>
  persistItemPosition: (id: string, x: number, y: number) => Promise<void>
  moveItemToFolder: (itemId: string, targetFolderId: string) => Promise<void>
  moveIntoFolder: (itemId: string, targetFolderId: string) => Promise<void>
  moveItemToDesktop: (itemId: string) => Promise<void>
  moveItemToDesktopAt: (itemId: string, x: number, y: number) => Promise<void>
  createItemInFolder: (parentId: string, itemType: DesktopItemType, name: string) => Promise<void>
}

export const useDesktopItemsStore = create<DesktopItemsStore>((set, get) => {
  const queryClient = getQueryClient()

  const toFolders = (pendingRenameItemIds: Record<string, true>) => {
    return getCachedFileItems(queryClient).map((item) => {
      return toDesktopFolder(item, Boolean(pendingRenameItemIds[item.id]))
    })
  }

  const syncStoreWithCache = (overrides?: Partial<DesktopItemsStore>) => {
    set((state) => ({
      desktopFolders: toFolders(state.pendingRenameItemIds),
      ...(overrides ?? {}),
    }))
  }

  return {
    desktopFolders: [],
    selectedFolderId: null,
    loading: false,
    error: null,
    pendingRenameItemIds: {},

    setSelectedFolderId: (id) => set({ selectedFolderId: id }),
    clearSelection: () => set({ selectedFolderId: null }),

    markItemForRename: (id) =>
      set((state) => {
        const nextPendingRenameItemIds: Record<string, true> = {
          ...state.pendingRenameItemIds,
          [id]: true,
        }

        return {
          pendingRenameItemIds: nextPendingRenameItemIds,
          desktopFolders: toFolders(nextPendingRenameItemIds),
        }
      }),

    clearItemRenameState: (id) =>
      set((state) => {
        if (!state.pendingRenameItemIds[id]) {
          return state
        }

        const nextPendingRenameItemIds: Record<string, true> = {
          ...state.pendingRenameItemIds,
        }
        delete nextPendingRenameItemIds[id]

        return {
          pendingRenameItemIds: nextPendingRenameItemIds,
          desktopFolders: toFolders(nextPendingRenameItemIds),
        }
      }),

    fetchItems: async () => {
      set({ loading: true, error: null })
      try {
        await fetchDesktopItems(queryClient)
        syncStoreWithCache({ loading: false, error: null })
      } catch (error) {
        set({
          loading: false,
          error: toErrorMessage(error),
        })
      }
    },

    createItem: async ({ name, itemType, parentId, x, y }) => {
      const trimmedName = name.trim()
      if (!trimmedName) {
        set({ error: "Item name cannot be empty" })
        return null
      }

      const defaultPosition = getDefaultDesktopPosition()
      const nextX = x ?? (parentId ? 0 : defaultPosition.x)
      const nextY = y ?? (parentId ? 0 : defaultPosition.y)

      try {
        const item = await createDesktopItem(
          queryClient,
          buildCreateFileParams({
            name: trimmedName,
            itemType,
            parentId,
            x: nextX,
            y: nextY,
          })
        )
        syncStoreWithCache({ error: null })
        return toDesktopFolder(item)
      } catch (error) {
        set({ error: toErrorMessage(error) })
        return null
      }
    },

    createFolder: async (x, y) => {
      const snapped = snapToViewport(x, y)

      const item = await get().createItem({
        name: "untitled folder",
        itemType: "folder",
        x: snapped.x,
        y: snapped.y,
      })
      if (item) {
        get().markItemForRename(item.id)
        syncStoreWithCache({
          selectedFolderId: item.id,
          error: null,
        })
      }
    },

    createFile: async (x, y, fileType) => {
      const snapped = snapToViewport(x, y)
      const defaults = resolveFileTypeDefaults(fileType)

      const item = await get().createItem({
        name: defaults.name,
        itemType: defaults.itemType,
        x: snapped.x,
        y: snapped.y,
      })
      if (item) {
        get().markItemForRename(item.id)
        syncStoreWithCache({
          selectedFolderId: item.id,
          error: null,
        })
      }
    },

    deleteItem: async (id) => {
      try {
        await deleteDesktopItem(queryClient, id)
        const selectedFolderId = get().selectedFolderId === id ? null : get().selectedFolderId
        syncStoreWithCache({ selectedFolderId, error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    renameItem: async (id, name) => {
      const trimmedName = name.trim()
      if (!trimmedName) return

      get().clearItemRenameState(id)
      try {
        await updateDesktopItem(queryClient, id, { name: trimmedName })
        syncStoreWithCache({ error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    moveItem: async (id, x, y) => {
      moveDesktopItemInCache(queryClient, id, x, y)
      syncStoreWithCache()
    },

    persistItemPosition: async (id, x, y) => {
      try {
        await updateDesktopItem(queryClient, id, { x, y })
        syncStoreWithCache({ error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    moveItemToFolder: async (itemId, targetFolderId) => {
      await get().moveIntoFolder(itemId, targetFolderId)
    },

    moveIntoFolder: async (itemId, targetFolderId) => {
      const items = getCachedFileItems(queryClient)
      const item = items.find((entry) => entry.id === itemId)
      const target = items.find((entry) => entry.id === targetFolderId)
      if (!item || !target || target.itemType !== "folder" || itemId === targetFolderId) {
        return
      }

      if (item.itemType === "folder") {
        let currentParentId = target.parentId
        while (currentParentId) {
          if (currentParentId === itemId) {
            return
          }
          currentParentId = items.find((entry) => entry.id === currentParentId)?.parentId ?? null
        }
      }

      try {
        await updateDesktopItem(queryClient, itemId, { parentId: targetFolderId })
        syncStoreWithCache({ error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    moveItemToDesktop: async (itemId) => {
      const items = getCachedFileItems(queryClient)
      const item = items.find((entry) => entry.id === itemId)
      if (!item) return

      const baseX = 100 + Math.random() * 200
      const baseY = 100 + Math.random() * 200

      try {
        await updateDesktopItem(queryClient, itemId, {
          parentId: null,
          x: baseX,
          y: baseY,
        })
        syncStoreWithCache({ error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    moveItemToDesktopAt: async (itemId, x, y) => {
      const items = getCachedFileItems(queryClient)
      const item = items.find((entry) => entry.id === itemId)
      if (!item) return

      const snapped = snapToViewport(x, y)

      try {
        await updateDesktopItem(queryClient, itemId, {
          parentId: null,
          x: snapped.x,
          y: snapped.y,
        })
        syncStoreWithCache({ error: null })
      } catch (error) {
        set({ error: toErrorMessage(error) })
      }
    },

    createItemInFolder: async (parentId, itemType, name) => {
      await get().createItem({
        name,
        itemType,
        parentId,
        x: 0,
        y: 0,
      })
    },
  }
})
