"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import type { DesktopFolder } from "@/lib/desktop/types"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  readTextEditorContent,
  waitForTextEditorReady,
  writeTextEditorContent,
} from "@/lib/textedit-content"

import {
  OPEN_TEXT_FILE_PARAMS,
  READ_TEXT_FILE_CONTENT_PARAMS,
  WRITE_TEXT_FILE_CONTENT_PARAMS,
} from "./types"

export function useTextEditTools() {
  const openFileWindow = useDesktopWindowStore((state) => state.openFileWindow)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)

  const readDesktopFoldersFromCache = useCallback(() => {
    return useDesktopItemsStore.getState().desktopFolders
  }, [])

  const refreshDesktopItems = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  const resolveTextFileById = useCallback(
    async (fileId: string) => {
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
    },
    [readDesktopFoldersFromCache, refreshDesktopItems]
  )

  const openTextFile = useCallback(
    async (args: { id?: string; name?: string }) => {
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

      openFileWindow(target.id, target.name)
      return {
        ok: true,
        openedFile: {
          id: target.id,
          name: target.name,
        },
      }
    },
    [openFileWindow, readDesktopFoldersFromCache, refreshDesktopItems]
  )

  const readTextFileContent = useCallback(
    async (args: { fileId?: string }) => {
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
    },
    [resolveTextFileById]
  )

  const writeTextFileContent = useCallback(
    async (args: { fileId?: string; content?: string }) => {
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
    },
    [openFileWindow, resolveTextFileById]
  )

  useFrontendTool(
    {
      name: "open_text_file",
      description: "Open a text file using the exact same flow as double-clicking that text file icon.",
      parameters: OPEN_TEXT_FILE_PARAMS,
      handler: async (args) => {
        return openTextFile({
          id: typeof args.id === "string" ? args.id : undefined,
          name: typeof args.name === "string" ? args.name : undefined,
        })
      },
    },
    [openTextFile]
  )

  useFrontendTool(
    {
      name: "read_text_file_content",
      description: "Read text file content. Prefers in-editor content if the file is currently open.",
      parameters: READ_TEXT_FILE_CONTENT_PARAMS,
      handler: async (args) => {
        return readTextFileContent({
          fileId: typeof args.fileId === "string" ? args.fileId : undefined,
        })
      },
    },
    [readTextFileContent]
  )

  useFrontendTool(
    {
      name: "write_text_file_content",
      description: "Write full content into a text file editor. Saving is handled by TextEdit auto-save.",
      parameters: WRITE_TEXT_FILE_CONTENT_PARAMS,
      handler: async (args) => {
        return writeTextFileContent({
          fileId: typeof args.fileId === "string" ? args.fileId : undefined,
          content: typeof args.content === "string" ? args.content : undefined,
        })
      },
    },
    [writeTextFileContent]
  )
}
