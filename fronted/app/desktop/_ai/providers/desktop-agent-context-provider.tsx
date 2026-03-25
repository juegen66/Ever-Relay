"use client"

import { useEffect, useMemo, useState } from "react"

import { useCopilotReadable } from "@copilotkit/react-core"

import { useLongTermMemory } from "@/hooks/use-long-term-memory"
import { useWorkingMemory } from "@/hooks/use-working-memory"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  readTextEditorContent,
  TEXTEDIT_CONTENT_CHANGED_EVENT,
  type TextEditContentChangedEventDetail,
} from "@/lib/textedit-content"
import { thirdPartySlugFromAppId } from "@/lib/third-party-app/types"

import {
  ACTIVE_TEXT_CONTENT_MAX_CHARS,
  BACKGROUND_TEXT_CONTENT_MAX_CHARS,
  selectOpenTextDocuments,
  truncateTextForAgent,
} from "./desktop-agent-context.helpers"

function WorkingMemoryContextSync() {
  useWorkingMemory()
  return null
}

interface DesktopAgentContextProviderProps {
  includeWorkingMemory?: boolean
}

export function DesktopAgentContextProvider({
  includeWorkingMemory = true,
}: DesktopAgentContextProviderProps = {}) {
  const windows = useDesktopWindowStore((state) => state.windows)
  const activeWindowId = useDesktopWindowStore((state) => state.activeWindowId)
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const actionLog = useDesktopActionLogStore((state) => state.actions)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const thirdPartyWindowId = useDesktopAgentStore((state) => state.thirdPartyWindowId)
  const [textContextRevision, setTextContextRevision] = useState(0)
  const [openTextDocuments, setOpenTextDocuments] = useState<
    Array<{
      windowId: string
      fileId: string
      fileName: string
      isActive: boolean
      content: string
      contentLength: number
      truncated: boolean
    }>
  >([])

  const { facts, patterns, episodes } = useLongTermMemory()

  const textDocumentRefs = useMemo(
    () => selectOpenTextDocuments(windows, activeWindowId),
    [activeWindowId, windows]
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleContentChanged = (event: Event) => {
      const detail = (event as CustomEvent<TextEditContentChangedEventDetail>).detail
      if (!detail?.fileId) {
        return
      }

      if (!textDocumentRefs.some((doc) => doc.fileId === detail.fileId)) {
        return
      }

      setTextContextRevision((value) => value + 1)
    }

    window.addEventListener(TEXTEDIT_CONTENT_CHANGED_EVENT, handleContentChanged as EventListener)
    return () => {
      window.removeEventListener(TEXTEDIT_CONTENT_CHANGED_EVENT, handleContentChanged as EventListener)
    }
  }, [textDocumentRefs])

  useEffect(() => {
    let cancelled = false

    async function loadOpenTextDocuments() {
      if (!textDocumentRefs.length) {
        setOpenTextDocuments([])
        return
      }

      const nextDocuments = await Promise.all(
        textDocumentRefs.map(async (doc) => {
          try {
            const rawContent = await readTextEditorContent(doc.fileId)
            const maxChars = doc.isActive
              ? ACTIVE_TEXT_CONTENT_MAX_CHARS
              : BACKGROUND_TEXT_CONTENT_MAX_CHARS

            return {
              ...doc,
              content: truncateTextForAgent(rawContent, maxChars),
              contentLength: rawContent.length,
              truncated: rawContent.length > maxChars,
            }
          } catch {
            return {
              ...doc,
              content: "",
              contentLength: 0,
              truncated: false,
            }
          }
        })
      )

      if (!cancelled) {
        setOpenTextDocuments(nextDocuments)
      }
    }

    void loadOpenTextDocuments()

    return () => {
      cancelled = true
    }
  }, [textContextRevision, textDocumentRefs])

  useCopilotReadable({
    description: "Current desktop window state",
    value: {
      openWindows: windows.map((w) => ({
        id: w.id,
        appId: w.appId,
        title: w.fileName ?? w.folderName ?? w.appId,
        fileId: w.fileId ?? null,
        fileName: w.fileName ?? null,
        folderId: w.folderId ?? null,
        folderName: w.folderName ?? null,
        minimized: w.minimized,
      })),
      activeWindowId,
      activeApp: activeWindowId
        ? windows.find((w) => w.id === activeWindowId)?.appId ?? null
        : null,
    },
  })

  useCopilotReadable({
    description:
      "Open text document content from TextEdit. Prioritize this when the active app is textedit or recent actions reference text files. " +
      "If the visible excerpt is not enough, use read_text_file_content with the provided fileId before making document-specific recommendations.",
    value: {
      openTextDocuments,
    },
  })

  useCopilotReadable({
    description: "Current desktop items",
    value: {
      desktopItems: desktopFolders.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.itemType,
        parentId: f.parentId,
      })),
    },
  })

  useCopilotReadable({
    description: "Recent desktop actions",
    value: {
      recentActions: actionLog,
    },
  })

  useCopilotReadable({
    description: "Active coding app context for sidebar work",
    value: {
      activeCodingApp: activeCodingApp
        ? {
            id: activeCodingApp.id,
            name: activeCodingApp.name,
            description: activeCodingApp.description ?? null,
            status: activeCodingApp.status,
            lastOpenedAt: activeCodingApp.lastOpenedAt ?? null,
          }
        : null,
    },
  })

  useCopilotReadable({
    description: "Active third-party app context for embedded iframe work",
    value: {
      activeThirdPartyApp: (() => {
        const targetWindow = windows.find(
          (windowState) => windowState.id === (thirdPartyWindowId ?? activeWindowId)
        )
        if (!targetWindow) return null

        const appSlug = thirdPartySlugFromAppId(targetWindow.appId)
        if (!appSlug) return null

        return {
          windowId: targetWindow.id,
          appId: targetWindow.appId,
          appSlug,
          title: targetWindow.fileName ?? targetWindow.folderName ?? targetWindow.appId,
        }
      })(),
    },
  })

  useCopilotReadable({
    description:
      "Long-term user memory from AFS (Agentic File System). " +
      "User memories are preferences/habits from Desktop/Memory/user. " +
      "Notes are observations and session summaries from Desktop/Memory/note. " +
      "Use these to personalize optimization advice.",
    value: {
      userMemories: facts.map((n) => ({ path: n.path, content: n.content, confidence: n.metadata?.confidence })),
      notes: patterns.map((n) => ({ path: n.path, content: n.content, confidence: n.metadata?.confidence })),
      recentNotes: episodes.map((n) => ({ path: n.path, content: n.content })),
    },
  })

  return includeWorkingMemory ? <WorkingMemoryContextSync /> : null
}
