"use client"

import { useCallback, useEffect } from "react"

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core"
import type { ActionRenderPropsWait } from "@copilotkit/react-core"

import type { DesktopFolder } from "@/app/desktop/components/macos/desktop-icon"
import { canvasApi } from "@/lib/api/modules/canvas"
import { toDesktopItemType } from "@/lib/desktop-items"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  readTextEditorContent,
  waitForTextEditorReady,
  writeTextEditorContent,
} from "@/lib/textedit-content"
import {
  getActiveCanvasProjectId,
  insertSvgIntoActiveCanvasSession,
  openCanvasProjectInSession,
  waitForCanvasSessionReady,
} from "@/lib/canvas-session"
import { ApprovalCard } from "../components/approval-card"
import { toAppId } from "../types"

type ToolParameter = {
  name: string
  type?: "string" | "number" | "boolean" | "object" | "string[]" | "number[]" | "boolean[]" | "object[]"
  description?: string
  required?: boolean
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

const OPEN_CANVAS_PROJECT_PARAMS: ToolParameter[] = [
  {
    name: "projectId",
    type: "string",
    description: "Canvas project id to open (preferred when known).",
    required: false,
  },
  {
    name: "projectName",
    type: "string",
    description: "Canvas project title to resolve and open when id is unknown.",
    required: false,
  },
]

const ADD_SVG_TO_CANVAS_PARAMS: ToolParameter[] = [
  {
    name: "prompt",
    type: "string",
    description: "Describe what SVG should be generated, for example: 'A blue rounded badge with text HI'.",
    required: true,
  },
  {
    name: "scale",
    type: "number",
    description: "Optional scale multiplier between 0.1 and 4. Default is 1.",
    required: false,
  },
  {
    name: "width",
    type: "number",
    description: "Optional generated SVG width (120-2400).",
    required: false,
  },
  {
    name: "height",
    type: "number",
    description: "Optional generated SVG height (120-2400).",
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
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)
  const createItem = useDesktopItemsStore((state) => state.createItem)
  const renameItem = useDesktopItemsStore((state) => state.renameItem)
  const deleteItem = useDesktopItemsStore((state) => state.deleteItem)
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const openFileWindow = useDesktopWindowStore((state) => state.openFileWindow)
  const windows = useDesktopWindowStore((state) => state.windows)

  const readDesktopFoldersFromCache = useCallback(() => {
    return useDesktopItemsStore.getState().desktopFolders
  }, [])

  const readWindowsFromCache = useCallback(() => {
    return useDesktopWindowStore.getState().windows
  }, [])

  const refreshDesktopItems = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  const createDesktopItem = useCallback(async (args: { name: string; itemType?: string; parentId?: string }) => {
    const normalizedType = toDesktopItemType(args.itemType)
    const name = args.name.trim()

    if (!name) {
      return {
        ok: false,
        error: "Item name cannot be empty",
      }
    }

    const item = await createItem({
      name,
      itemType: normalizedType,
      parentId: args.parentId || undefined,
    })
    if (!item) {
      return {
        ok: false,
        error: "Failed to create item",
      }
    }

    await refreshDesktopItems()

    return {
      ok: true,
      item: {
        id: item.id,
        name: item.name,
        itemType: item.itemType,
      },
    }
  }, [createItem, refreshDesktopItems])

  useEffect(() => {
    void refreshDesktopItems()
  }, [refreshDesktopItems])

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
      const items = readDesktopFoldersFromCache()
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
      await refreshDesktopItems()
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
  }, [openFileWindow, readDesktopFoldersFromCache, refreshDesktopItems])

  const resolveTextFileById = useCallback(async (fileId: string) => {
    const findTarget = () => {
      const items = readDesktopFoldersFromCache()
      return items.find((item) => item.id === fileId) ?? null
    }

    let target = findTarget()
    if (!target) {
      await refreshDesktopItems()
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
  }, [readDesktopFoldersFromCache, refreshDesktopItems])

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

  const openCanvasProject = useCallback(async (args: { projectId?: string; projectName?: string }) => {
    const projectId = typeof args.projectId === "string" ? args.projectId.trim() : ""
    const projectName = typeof args.projectName === "string" ? args.projectName.trim() : ""

    if (!projectId && !projectName) {
      return {
        ok: false,
        error: "projectId or projectName is required",
      }
    }

    const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
      return windowState.appId === "canvas" && !windowState.minimized
    })

    if (!hasVisibleCanvasWindow) {
      openApp("canvas")
    }

    const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
    if (!ready) {
      return {
        ok: false,
        error: hasVisibleCanvasWindow
          ? "Canvas app is not ready yet. Please retry shortly."
          : "Canvas app opened. Please wait for it to load, then retry open_canvas_project.",
      }
    }

    const result = await openCanvasProjectInSession({
      projectId: projectId || undefined,
      projectName: projectName || undefined,
    })

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        candidates: result.candidates,
      }
    }

    return {
      ok: true,
      projectId: result.projectId,
      mode: "editor",
    }
  }, [openApp, readWindowsFromCache])

  const addSvgToCanvas = useCallback(async (args: { prompt?: string; scale?: number; width?: number; height?: number }) => {
    const prompt = typeof args.prompt === "string" ? args.prompt.trim() : ""
    const scale = typeof args.scale === "number" ? args.scale : undefined
    const width = typeof args.width === "number" ? Math.trunc(args.width) : undefined
    const height = typeof args.height === "number" ? Math.trunc(args.height) : undefined

    if (!prompt) {
      return {
        ok: false,
        error: "prompt is required",
      }
    }

    if (scale !== undefined && (!Number.isFinite(scale) || scale < 0.1 || scale > 4)) {
      return {
        ok: false,
        error: "scale must be a number between 0.1 and 4",
      }
    }

    const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
      return windowState.appId === "canvas" && !windowState.minimized
    })

    if (!hasVisibleCanvasWindow) {
      openApp("canvas")
    }

    const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
    if (!ready) {
      return {
        ok: false,
        error: hasVisibleCanvasWindow
          ? "Canvas app is not ready yet. Please retry shortly."
          : "Canvas app opened. Please wait for it to load, then call open_canvas_project before add_svg_to_canvas.",
      }
    }

    const activeProjectId = getActiveCanvasProjectId()
    if (!activeProjectId) {
      return {
        ok: false,
        error: "No active canvas project. Call open_canvas_project first.",
      }
    }

    if (width !== undefined && (width < 120 || width > 2400)) {
      return {
        ok: false,
        error: "width must be between 120 and 2400",
      }
    }

    if (height !== undefined && (height < 120 || height > 2400)) {
      return {
        ok: false,
        error: "height must be between 120 and 2400",
      }
    }

    let preparedSvg: Awaited<ReturnType<typeof canvasApi.generateSvg>>
    try {
      preparedSvg = await canvasApi.generateSvg({
        prompt,
        width,
        height,
      })
    } catch (error) {
      return {
        ok: false,
        error: toErrorMessage(error),
      }
    }

    const inserted = await insertSvgIntoActiveCanvasSession({
      svg: preparedSvg.svg,
      scale,
    })

    if (!inserted.ok) {
      return inserted
    }

    return {
      ok: true,
      projectId: inserted.projectId,
      insertedObjectCount: inserted.insertedObjectCount,
      generatedWidth: preparedSvg.width,
      generatedHeight: preparedSvg.height,
      generatedAt: preparedSvg.generatedAt,
    }
  }, [openApp, readWindowsFromCache])

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
    name: "open_canvas_project",
    description: "Open Canvas app and navigate to a specific project by id or name.",
    parameters: OPEN_CANVAS_PROJECT_PARAMS,
    handler: async (args) => {
      return openCanvasProject({
        projectId: typeof args.projectId === "string" ? args.projectId : undefined,
        projectName: typeof args.projectName === "string" ? args.projectName : undefined,
      })
    },
  }, [openCanvasProject])

  useFrontendTool({
    name: "add_svg_to_canvas",
    description: "Generate SVG via backend and insert it into the currently opened canvas project.",
    parameters: ADD_SVG_TO_CANVAS_PARAMS,
    handler: async (args) => {
      return addSvgToCanvas({
        prompt: typeof args.prompt === "string" ? args.prompt : undefined,
        scale: typeof args.scale === "number" ? args.scale : undefined,
        width: typeof args.width === "number" ? args.width : undefined,
        height: typeof args.height === "number" ? args.height : undefined,
      })
    },
  }, [addSvgToCanvas])

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
      await refreshDesktopItems()
      return {
        ok: true,
        count: readDesktopFoldersFromCache().length,
      }
    },
  }, [readDesktopFoldersFromCache, refreshDesktopItems])

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
            await refreshDesktopItems()
            const renamed = readDesktopFoldersFromCache().find((item) => item.id === id)
            if (!renamed || renamed.name !== name) {
              respond({ approved: false, ok: false, error: "Failed to rename item" })
              return
            }

            respond({ approved: true, ok: true, id: renamed.id, name: renamed.name })
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
  }, [readDesktopFoldersFromCache, refreshDesktopItems, renameItem])

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
            await refreshDesktopItems()
            const deleted = !readDesktopFoldersFromCache().some((item) => item.id === id)
            if (!deleted) {
              respond({ approved: false, ok: false, error: "Failed to delete item" })
              return
            }
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
  }, [deleteItem, readDesktopFoldersFromCache, refreshDesktopItems])
}
