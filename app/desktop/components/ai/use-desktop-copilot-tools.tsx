"use client"

import { useCallback } from "react"

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core"
import type { ActionRenderPropsWait } from "@copilotkit/react-core"

import type { DesktopFolder, DesktopItemType } from "@/app/desktop/components/macos/desktop-icon"
import { filesApi } from "@/lib/api/modules/files"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  readTextEditorContent,
  waitForTextEditorReady,
  writeTextEditorContent,
} from "@/lib/textedit-content"
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
    description: "App id to open: finder|calculator|notes|terminal|safari|settings|photos|music|calendar|mail|weather|clock|maps|appstore|messages|canvas|textedit. To open a specific text file, use open_text_file.",
    required: true,
  },
]

const OPEN_TEXT_FILE_PARAMS: ToolParameter[] = [
  {
    name: "id",
    type: "string",
    description: "Text file id to open",
    required: false,
  },
  {
    name: "name",
    type: "string",
    description: "Text file name to open (case-insensitive)",
    required: false,
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

const READ_TEXT_FILE_CONTENT_PARAMS: ToolParameter[] = [
  {
    name: "fileId",
    type: "string",
    description: "Text file id to read",
    required: true,
  },
]

const WRITE_TEXT_FILE_CONTENT_PARAMS: ToolParameter[] = [
  {
    name: "fileId",
    type: "string",
    description: "Text file id to write",
    required: true,
  },
  {
    name: "content",
    type: "string",
    description: "The full text content to write into editor",
    required: true,
  },
]

export function useDesktopCopilotTools() {
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const openFileWindow = useDesktopWindowStore((state) => state.openFileWindow)
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

  const openTextFile = useCallback(async (args: { id?: string; name?: string }) => {
    const rawId = typeof args.id === "string" ? args.id.trim() : ""
    const rawName = typeof args.name === "string" ? args.name.trim() : ""

    if (!rawId && !rawName) {
      return {
        ok: false,
        error: "id or name is required",
      }
    }

    const findTarget = () => {
      const items = useDesktopItemsStore.getState().desktopFolders
      const textItems = items.filter((item) => item.itemType === "text")

      if (rawId) {
        return textItems.find((item) => item.id === rawId) ?? null
      }

      const normalizedName = rawName.toLowerCase()
      const exactMatch = textItems.find((item) => item.name.trim().toLowerCase() === normalizedName)
      if (exactMatch) return exactMatch

      return textItems.find((item) => item.name.trim().toLowerCase().includes(normalizedName)) ?? null
    }

    let target = findTarget()
    if (!target) {
      await fetchItems()
      target = findTarget()
    }

    if (!target) {
      return {
        ok: false,
        error: rawId ? `Text file not found by id: ${rawId}` : `Text file not found by name: ${rawName}`,
      }
    }

    // Reuse the exact same path as double-clicking a text file icon.
    openFileWindow(target.id, target.name)
    return {
      ok: true,
      openedFile: {
        id: target.id,
        name: target.name,
      },
    }
  }, [fetchItems, openFileWindow])

  const resolveTextFileById = useCallback(async (fileId: string) => {
    const findTarget = () => {
      const items = useDesktopItemsStore.getState().desktopFolders
      return items.find((item) => item.id === fileId) ?? null
    }

    let target = findTarget()
    if (!target) {
      await fetchItems()
      target = findTarget()
    }

    if (!target) {
      return {
        ok: false as const,
        error: `File not found by id: ${fileId}`,
      }
    }

    if (target.itemType !== "text") {
      return {
        ok: false as const,
        error: `Item is not a text file: ${fileId}`,
      }
    }

    return {
      ok: true as const,
      item: target as DesktopFolder,
    }
  }, [fetchItems])

  const readTextFileContent = useCallback(async (args: { fileId?: string }) => {
    const fileId = typeof args.fileId === "string" ? args.fileId.trim() : ""
    if (!fileId) {
      return {
        ok: false,
        error: "fileId is required",
      }
    }

    const resolved = await resolveTextFileById(fileId)
    if (!resolved.ok) {
      return resolved
    }

    const content = await readTextEditorContent(fileId)
    return {
      ok: true,
      fileId,
      content,
      length: content.length,
    }
  }, [resolveTextFileById])

  const writeTextFileContent = useCallback(async (args: { fileId?: string; content?: string }) => {
    const fileId = typeof args.fileId === "string" ? args.fileId.trim() : ""
    if (!fileId) {
      return {
        ok: false,
        error: "fileId is required",
      }
    }

    if (typeof args.content !== "string") {
      return {
        ok: false,
        error: "content is required",
      }
    }

    const resolved = await resolveTextFileById(fileId)
    if (!resolved.ok) {
      return resolved
    }

    openFileWindow(fileId, resolved.item.name)
    const isReady = await waitForTextEditorReady(fileId, 5000)
    if (!isReady) {
      return {
        ok: false,
        error: `Text editor is not ready for file: ${fileId}`,
      }
    }

    writeTextEditorContent(fileId, args.content)
    return {
      ok: true,
      fileId,
      writtenLength: args.content.length,
    }
  }, [openFileWindow, resolveTextFileById])

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
    name: "open_text_file",
    description: "Open a text file using the exact same flow as double-clicking that text file icon.",
    parameters: OPEN_TEXT_FILE_PARAMS,
    handler: async (args) => {
      return openTextFile({
        id: typeof args.id === "string" ? args.id : undefined,
        name: typeof args.name === "string" ? args.name : undefined,
      })
    },
  }, [openTextFile])

  useFrontendTool({
    name: "read_text_file_content",
    description: "Read text file content. Prefers in-editor content if the file is currently open.",
    parameters: READ_TEXT_FILE_CONTENT_PARAMS,
    handler: async (args) => {
      return readTextFileContent({
        fileId: typeof args.fileId === "string" ? args.fileId : undefined,
      })
    },
  }, [readTextFileContent])

  useFrontendTool({
    name: "write_text_file_content",
    description: "Write full content into a text file editor. Saving is handled by TextEdit auto-save.",
    parameters: WRITE_TEXT_FILE_CONTENT_PARAMS,
    handler: async (args) => {
      return writeTextFileContent({
        fileId: typeof args.fileId === "string" ? args.fileId : undefined,
        content: typeof args.content === "string" ? args.content : undefined,
      })
    },
  }, [writeTextFileContent])

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
