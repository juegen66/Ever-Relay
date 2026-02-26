"use client"

import { useCallback } from "react"

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core"
import type { ActionRenderPropsWait } from "@copilotkit/react-core"

import type { DesktopItemType } from "@/app/desktop/components/macos/desktop-icon"
import { filesApi } from "@/lib/api/modules/files"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { ApprovalCard } from "./approval-card"
import { toAppId } from "./types"

const DESKTOP_ITEM_TYPES: DesktopItemType[] = ["folder", "text", "image", "code", "spreadsheet", "generic"]

type ToolParameter = {
  name: string
  type?: "string" | "number" | "boolean" | "object" | "string[]" | "number[]" | "boolean[]" | "object[]"
  description?: string
  required?: boolean
}

function toDesktopItemType(value: string | undefined): DesktopItemType {
  if (value && (DESKTOP_ITEM_TYPES as string[]).includes(value)) {
    return value as DesktopItemType
  }
  return "generic"
}

function getDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 180, y: 140 }
  }

  return {
    x: Math.max(80, Math.round(window.innerWidth * 0.22)),
    y: Math.max(90, Math.round(window.innerHeight * 0.22)),
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return "Unknown error"
}

const OPEN_APP_PARAMS: ToolParameter[] = [
  {
    name: "appId",
    type: "string",
    description: "App id to open: finder|calculator|notes|terminal|safari|settings|photos|music|calendar|mail|weather|clock|maps|appstore|messages|canvas|textedit",
    required: true,
  },
]

const CREATE_ITEM_PARAMS: ToolParameter[] = [
  {
    name: "name",
    type: "string",
    description: "Display name for the new item",
    required: true,
  },
  {
    name: "itemType",
    type: "string",
    description: "folder|text|image|code|spreadsheet|generic",
    required: false,
  },
  {
    name: "parentId",
    type: "string",
    description: "Optional parent folder id",
    required: false,
  },
]

const RENAME_ITEM_PARAMS: ToolParameter[] = [
  {
    name: "id",
    type: "string",
    description: "Item id",
    required: true,
  },
  {
    name: "name",
    type: "string",
    description: "New name",
    required: true,
  },
]

const DELETE_ITEM_PARAMS: ToolParameter[] = [
  {
    name: "id",
    type: "string",
    description: "Item id",
    required: true,
  },
]

export function useDesktopCopilotTools() {
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const windows = useDesktopWindowStore((state) => state.windows)

  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const renameItem = useDesktopItemsStore((state) => state.renameItem)
  const deleteItem = useDesktopItemsStore((state) => state.deleteItem)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)

  const createDesktopItem = useCallback(async (args: { name: string; itemType?: string; parentId?: string }) => {
    const normalizedType = toDesktopItemType(args.itemType)
    const name = args.name.trim()

    if (!name) {
      return {
        ok: false,
        error: "Item name cannot be empty",
      }
    }

    const { x, y } = getDefaultPosition()

    const basePayload = {
      name,
      itemType: normalizedType,
      parentId: args.parentId || undefined,
      x,
      y,
    }

    if (normalizedType === "folder") {
      const item = await filesApi.create(basePayload)
      await fetchItems()
      return {
        ok: true,
        item: {
          id: item.id,
          name: item.name,
          itemType: item.itemType,
        },
      }
    }

    const defaultMimeType: Record<DesktopItemType, string> = {
      folder: "application/octet-stream",
      text: "text/plain",
      image: "image/png",
      code: "text/javascript",
      spreadsheet: "text/csv",
      generic: "application/octet-stream",
    }

    const item = await filesApi.create({
      ...basePayload,
      content: "",
      fileSize: 0,
      mimeType: defaultMimeType[normalizedType],
    })

    await fetchItems()

    return {
      ok: true,
      item: {
        id: item.id,
        name: item.name,
        itemType: item.itemType,
      },
    }
  }, [fetchItems])

  useFrontendTool({
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
  }, [openApp])

  useFrontendTool({
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
  }, [windows])

  useFrontendTool({
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
  }, [desktopFolders])

  useFrontendTool({
    name: "refresh_desktop_items",
    description: "Reload desktop items from backend.",
    handler: async () => {
      await fetchItems()
      return {
        ok: true,
        count: useDesktopItemsStore.getState().desktopFolders.length,
      }
    },
  }, [fetchItems])

  useHumanInTheLoop({
    name: "create_desktop_item",
    description: "Create a desktop item (file/folder). Always requires user approval.",
    parameters: CREATE_ITEM_PARAMS,
    render: ({ status, args, respond, result }: ActionRenderPropsWait) => (
      <ApprovalCard
        title="Create Desktop Item"
        summary={JSON.stringify(args ?? {}, null, 2)}
        status={status}
        result={result}
        onApprove={async () => {
          if (status !== "executing" || !respond) return

          try {
            const response = await createDesktopItem({
              name: String(args.name ?? ""),
              itemType: typeof args.itemType === "string" ? args.itemType : undefined,
              parentId: typeof args.parentId === "string" ? args.parentId : undefined,
            })
            respond({ approved: true, ...response })
          } catch (error) {
            respond({
              approved: false,
              ok: false,
              error: toErrorMessage(error),
            })
          }
        }}
        onReject={() => {
          if (status !== "executing" || !respond) return
          respond({ approved: false, cancelled: true })
        }}
      />
    ),
  }, [createDesktopItem])

  useHumanInTheLoop({
    name: "rename_desktop_item",
    description: "Rename a desktop item. Always requires user approval.",
    parameters: RENAME_ITEM_PARAMS,
    render: ({ status, args, respond, result }: ActionRenderPropsWait) => (
      <ApprovalCard
        title="Rename Desktop Item"
        summary={JSON.stringify(args ?? {}, null, 2)}
        status={status}
        result={result}
        onApprove={async () => {
          if (status !== "executing" || !respond) return

          try {
            const id = String(args.id ?? "")
            const name = String(args.name ?? "").trim()
            if (!id || !name) {
              respond({ approved: false, ok: false, error: "id and name are required" })
              return
            }

            await renameItem(id, name)
            await fetchItems()
            respond({ approved: true, ok: true, id, name })
          } catch (error) {
            respond({
              approved: false,
              ok: false,
              error: toErrorMessage(error),
            })
          }
        }}
        onReject={() => {
          if (status !== "executing" || !respond) return
          respond({ approved: false, cancelled: true })
        }}
      />
    ),
  }, [fetchItems, renameItem])

  useHumanInTheLoop({
    name: "delete_desktop_item",
    description: "Delete a desktop item. Always requires user approval.",
    parameters: DELETE_ITEM_PARAMS,
    render: ({ status, args, respond, result }: ActionRenderPropsWait) => (
      <ApprovalCard
        title="Delete Desktop Item"
        summary={JSON.stringify(args ?? {}, null, 2)}
        status={status}
        result={result}
        onApprove={async () => {
          if (status !== "executing" || !respond) return

          try {
            const id = String(args.id ?? "")
            if (!id) {
              respond({ approved: false, ok: false, error: "id is required" })
              return
            }

            await deleteItem(id)
            await fetchItems()
            respond({ approved: true, ok: true, id })
          } catch (error) {
            respond({
              approved: false,
              ok: false,
              error: toErrorMessage(error),
            })
          }
        }}
        onReject={() => {
          if (status !== "executing" || !respond) return
          respond({ approved: false, cancelled: true })
        }}
      />
    ),
  }, [deleteItem, fetchItems])
}
