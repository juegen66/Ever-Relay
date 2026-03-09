"use client"

import { useCallback, useEffect } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

import { toAppId } from "../types"
import { MOVE_DESKTOP_ITEM_PARAMS, OPEN_APP_PARAMS, toErrorMessage } from "./types"

export function useDesktopCoreTools() {
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const windows = useDesktopWindowStore((state) => state.windows)
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)
  const moveIntoFolder = useDesktopItemsStore((state) => state.moveIntoFolder)
  const moveItemToDesktop = useDesktopItemsStore((state) => state.moveItemToDesktop)
  const moveItemToDesktopAt = useDesktopItemsStore((state) => state.moveItemToDesktopAt)

  const readDesktopFoldersFromCache = useCallback(() => {
    return useDesktopItemsStore.getState().desktopFolders
  }, [])

  const refreshDesktopItems = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  useEffect(() => {
    void refreshDesktopItems()
  }, [refreshDesktopItems])

  const moveDesktopItem = useCallback(
    async (args: { itemId?: string; targetFolderId?: string; x?: number; y?: number }) => {
      try {
        const itemId = typeof args.itemId === "string" ? args.itemId.trim() : ""
        const targetFolderId =
          typeof args.targetFolderId === "string" && args.targetFolderId.trim()
            ? args.targetFolderId.trim()
            : null
        const hasX = typeof args.x === "number"
        const hasY = typeof args.y === "number"
        const desktopX = hasX ? args.x : undefined
        const desktopY = hasY ? args.y : undefined

        if (!itemId) {
          return { ok: false, error: "itemId is required" }
        }

        if (hasX !== hasY) {
          return { ok: false, error: "x and y must be provided together" }
        }

        const readItems = readDesktopFoldersFromCache
        let items = readItems()
        if (!items.length) {
          await refreshDesktopItems()
          items = readItems()
        }

        const item = items.find((entry) => entry.id === itemId)
        if (!item) {
          return { ok: false, error: `Item not found: ${itemId}` }
        }

        if (targetFolderId) {
          const target = items.find((entry) => entry.id === targetFolderId)
          if (!target) {
            return { ok: false, error: `Target folder not found: ${targetFolderId}` }
          }
          if (target.itemType !== "folder") {
            return { ok: false, error: `Target item is not a folder: ${targetFolderId}` }
          }
          if (itemId === targetFolderId) {
            return { ok: false, error: "Cannot move item into itself" }
          }

          if (item.itemType === "folder") {
            const itemById = new Map(items.map((entry) => [entry.id, entry]))
            let currentParentId = target.parentId ?? null

            while (currentParentId) {
              if (currentParentId === itemId) {
                return {
                  ok: false,
                  error: "Cannot move a folder into its descendant",
                }
              }
              currentParentId = itemById.get(currentParentId)?.parentId ?? null
            }
          }

          await moveIntoFolder(itemId, targetFolderId)
          await refreshDesktopItems()

          const movedItem = readDesktopFoldersFromCache().find((entry) => entry.id === itemId)
          if (!movedItem || movedItem.parentId !== targetFolderId) {
            return { ok: false, error: "Move failed: item did not reach target folder" }
          }

          return {
            ok: true,
            destination: { type: "folder", targetFolderId },
            item: {
              id: movedItem.id,
              name: movedItem.name,
              parentId: movedItem.parentId ?? null,
              x: movedItem.x,
              y: movedItem.y,
            },
          }
        }

        if (desktopX !== undefined && desktopY !== undefined) {
          await moveItemToDesktopAt(itemId, desktopX, desktopY)
        } else {
          await moveItemToDesktop(itemId)
        }
        await refreshDesktopItems()

        const movedItem = readDesktopFoldersFromCache().find((entry) => entry.id === itemId)
        if (!movedItem || movedItem.parentId) {
          return { ok: false, error: "Move failed: item did not move to desktop" }
        }

        return {
          ok: true,
          destination: { type: "desktop", x: movedItem.x, y: movedItem.y },
          item: {
            id: movedItem.id,
            name: movedItem.name,
            parentId: movedItem.parentId ?? null,
            x: movedItem.x,
            y: movedItem.y,
          },
        }
      } catch (error) {
        return {
          ok: false,
          error: toErrorMessage(error),
        }
      }
    },
    [
      moveIntoFolder,
      moveItemToDesktop,
      moveItemToDesktopAt,
      readDesktopFoldersFromCache,
      refreshDesktopItems,
    ]
  )

  useFrontendTool(
    {
      name: "open_app",
      description: "Open an app window in the CloudOS desktop.",
      parameters: OPEN_APP_PARAMS,
      handler: async (args) => {
        const appId = toAppId(String(args.appId ?? ""))
        if (!appId) {
          return {
            ok: false,
            error: `Unsupported appId: ${args.appId}`,
          }
        }

        openApp(appId)
        return {
          ok: true,
          openedApp: appId,
        }
      },
    },
    [openApp]
  )

  useFrontendTool(
    {
      name: "list_open_windows",
      description: "List current desktop windows and their app ids.",
      handler: async () => {
        return {
          ok: true,
          count: windows.length,
          windows: windows.map((windowState) => ({
            id: windowState.id,
            appId: windowState.appId,
            minimized: windowState.minimized,
            maximized: windowState.maximized,
            title: windowState.folderName ?? windowState.fileName ?? null,
          })),
        }
      },
    },
    [windows]
  )

  useFrontendTool(
    {
      name: "list_desktop_items",
      description: "List desktop items currently visible to the user.",
      handler: async () => {
        return {
          ok: true,
          count: desktopFolders.length,
          items: desktopFolders.map((item) => ({
            id: item.id,
            name: item.name,
            itemType: item.itemType,
            parentId: item.parentId,
          })),
        }
      },
    },
    [desktopFolders]
  )

  useFrontendTool(
    {
      name: "refresh_desktop_items",
      description: "Reload desktop items from backend.",
      handler: async () => {
        await refreshDesktopItems()
        return {
          ok: true,
          count: readDesktopFoldersFromCache().length,
        }
      },
    },
    [readDesktopFoldersFromCache, refreshDesktopItems]
  )

  useFrontendTool(
    {
      name: "move_desktop_item",
      description:
        "Move a desktop item into a folder, or back to desktop. If targetFolderId is omitted, item is moved to desktop.",
      parameters: MOVE_DESKTOP_ITEM_PARAMS,
      handler: async (args) => {
        return moveDesktopItem({
          itemId: typeof args.itemId === "string" ? args.itemId : undefined,
          targetFolderId:
            typeof args.targetFolderId === "string" ? args.targetFolderId : undefined,
          x: typeof args.x === "number" ? args.x : undefined,
          y: typeof args.y === "number" ? args.y : undefined,
        })
      },
    },
    [moveDesktopItem]
  )
}
