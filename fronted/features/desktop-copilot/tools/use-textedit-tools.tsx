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
  toolErr,
  toolOk,
  toolRetryLater,
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
        return toolErr(`File not found by id: ${fileId}`)
      }

      if (target.itemType !== "text") {
        return toolErr(`Item is not a text file: ${fileId}`)
      }

      return toolOk(`Resolved text file "${target.name}" (${target.id}).`, {
        item: target as DesktopFolder,
      })
    },
    [readDesktopFoldersFromCache, refreshDesktopItems]
  )

  const openTextFile = useCallback(
    async (args: { id?: string; name?: string }) => {
      const rawId = typeof args.id === "string" ? args.id.trim() : ""
      const rawName = typeof args.name === "string" ? args.name.trim() : ""

      if (!rawId && !rawName) {
        return toolErr("id or name is required")
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
        return toolErr(
          rawId ? `Text file not found by id: ${rawId}` : `Text file not found by name: ${rawName}`
        )
      }

      openFileWindow(target.id, target.name)
      return toolOk(`Succeeded: opened text file "${target.name}" in the editor.`, {
        openedFile: {
          id: target.id,
          name: target.name,
        },
      })
    },
    [openFileWindow, readDesktopFoldersFromCache, refreshDesktopItems]
  )

  const readTextFileContent = useCallback(
    async (args: { fileId?: string }) => {
      const fileId = typeof args.fileId === "string" ? args.fileId.trim() : ""
      if (!fileId) {
        return toolErr("fileId is required")
      }

      const resolved = await resolveTextFileById(fileId)
      if (!resolved.ok) {
        return resolved
      }

      const content = await readTextEditorContent(fileId)
      return toolOk(
        `Succeeded: read ${content.length} character(s) from the text file (fileId ${fileId}).`,
        {
          fileId,
          content,
          length: content.length,
        }
      )
    },
    [resolveTextFileById]
  )

  const writeTextFileContent = useCallback(
    async (args: { fileId?: string; content?: string }) => {
      const fileId = typeof args.fileId === "string" ? args.fileId.trim() : ""
      if (!fileId) {
        return toolErr("fileId is required")
      }

      if (typeof args.content !== "string") {
        return toolErr("content is required")
      }

      const resolved = await resolveTextFileById(fileId)
      if (!resolved.ok) {
        return resolved
      }

      openFileWindow(fileId, resolved.item.name)
      const isReady = await waitForTextEditorReady(fileId, 5000)
      if (!isReady) {
        return toolRetryLater(
          `Text editor is not ready for file: ${fileId}`,
          {
            fileId,
          },
          {
            nextAction: "wait_for_text_editor_ready",
          }
        )
      }

      writeTextEditorContent(fileId, args.content)
      return toolOk(
        `Succeeded: wrote ${args.content.length} character(s) into the text editor for fileId ${fileId} (auto-save will persist).`,
        {
          fileId,
          writtenLength: args.content.length,
        }
      )
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
