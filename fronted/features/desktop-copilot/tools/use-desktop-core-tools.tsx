"use client"

import { useCallback, useEffect } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

import { toAppId } from "../types"
import {
  MOVE_DESKTOP_ITEM_PARAMS,
  OPEN_APP_PARAMS,
  toErrorMessage,
  type ToolLifecycleStatus,
} from "./types"

type ToolSuccess<T extends Record<string, unknown> = Record<string, never>> = {
  status: ToolLifecycleStatus
  ok: true
  summary: string
  message: string
  shouldStop: false
  retryable: false
  nextAction: null
} & T

type ToolFailure = {
  status: ToolLifecycleStatus
  ok: false
  error: string
  message: string
  shouldStop: true
  retryable: false
  nextAction: "reply_to_user"
}

function toolSuccess<T extends Record<string, unknown>>(summary: string, data: T): ToolSuccess<T> {
  return {
    ok: true,
    summary,
    message: summary,
    ...data,
    status: "completed",
    shouldStop: false,
    retryable: false,
    nextAction: null,
  }
}

function toolFailure(error: string): ToolFailure {
  const message = `Failed: ${error}`
  return {
    ok: false,
    error,
    message,
    status: "blocked",
    shouldStop: true,
    retryable: false,
    nextAction: "reply_to_user",
  }
}

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
          return toolFailure("itemId is required")
        }

        if (hasX !== hasY) {
          return toolFailure("x and y must be provided together")
        }

        const readItems = readDesktopFoldersFromCache
        let items = readItems()
        if (!items.length) {
          await refreshDesktopItems()
          items = readItems()
        }

        const item = items.find((entry) => entry.id === itemId)
        if (!item) {
          return toolFailure(`Item not found: ${itemId}`)
        }

        if (targetFolderId) {
          const target = items.find((entry) => entry.id === targetFolderId)
          if (!target) {
            return toolFailure(`Target folder not found: ${targetFolderId}`)
          }
          if (target.itemType !== "folder") {
            return toolFailure(`Target item is not a folder: ${targetFolderId}`)
          }
          if (itemId === targetFolderId) {
            return toolFailure("Cannot move item into itself")
          }

          if (item.itemType === "folder") {
            const itemById = new Map(items.map((entry) => [entry.id, entry]))
            let currentParentId = target.parentId ?? null

            while (currentParentId) {
              if (currentParentId === itemId) {
                return toolFailure("Cannot move a folder into its descendant")
              }
              currentParentId = itemById.get(currentParentId)?.parentId ?? null
            }
          }

          await moveIntoFolder(itemId, targetFolderId)
          await refreshDesktopItems()

          const movedItem = readDesktopFoldersFromCache().find((entry) => entry.id === itemId)
          if (!movedItem || movedItem.parentId !== targetFolderId) {
            return toolFailure("Move failed: item did not reach target folder")
          }

          return toolSuccess(
            `Success: moved "${movedItem.name}" into folder id ${targetFolderId}.`,
            {
              destination: { type: "folder" as const, targetFolderId },
              item: {
                id: movedItem.id,
                name: movedItem.name,
                parentId: movedItem.parentId ?? null,
                x: movedItem.x,
                y: movedItem.y,
              },
            }
          )
        }

        if (desktopX !== undefined && desktopY !== undefined) {
          await moveItemToDesktopAt(itemId, desktopX, desktopY)
        } else {
          await moveItemToDesktop(itemId)
        }
        await refreshDesktopItems()

        const movedItem = readDesktopFoldersFromCache().find((entry) => entry.id === itemId)
        if (!movedItem || movedItem.parentId) {
          return toolFailure("Move failed: item did not move to desktop")
        }

        const placed =
          desktopX !== undefined && desktopY !== undefined
            ? `at desktop position (${desktopX}, ${desktopY})`
            : "to the desktop (root level)"

        return toolSuccess(`Success: moved "${movedItem.name}" ${placed}.`, {
          destination: { type: "desktop" as const, x: movedItem.x, y: movedItem.y },
          item: {
            id: movedItem.id,
            name: movedItem.name,
            parentId: movedItem.parentId ?? null,
            x: movedItem.x,
            y: movedItem.y,
          },
        })
      } catch (error) {
        return toolFailure(toErrorMessage(error))
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
          return toolFailure(`Unsupported appId: ${args.appId}`)
        }

        openApp(appId)
        return toolSuccess(`Success: opened app "${appId}" (window should appear on the desktop).`, {
          openedApp: appId,
        })
      },
    },
    [openApp]
  )

  useFrontendTool(
    {
      name: "list_open_windows",
      description: "List current desktop windows and their app ids.",
      handler: async () => {
        const list = windows.map((windowState) => ({
          id: windowState.id,
          appId: windowState.appId,
          minimized: windowState.minimized,
          maximized: windowState.maximized,
          title: windowState.folderName ?? windowState.fileName ?? null,
        }))
        return toolSuccess(
          `Success: listed ${windows.length} open window(s); see windows for app ids and titles.`,
          { count: windows.length, windows: list }
        )
      },
    },
    [windows]
  )

  useFrontendTool(
    {
      name: "list_desktop_items",
      description: "List desktop items currently visible to the user.",
      handler: async () => {
        const items = desktopFolders.map((item) => ({
          id: item.id,
          name: item.name,
          itemType: item.itemType,
          parentId: item.parentId,
        }))
        return toolSuccess(
          `Success: listed ${desktopFolders.length} desktop item(s); see items for ids, names, and types.`,
          { count: desktopFolders.length, items }
        )
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
        const count = readDesktopFoldersFromCache().length
        return toolSuccess(
          `Success: reloaded desktop items from the server; ${count} item(s) now in cache.`,
          { count }
        )
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
