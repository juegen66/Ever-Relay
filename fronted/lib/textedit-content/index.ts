"use client"

import { filesApi } from "@/lib/api/modules/files"
import type { TextEditWriteEventDetail } from "./types"

export { type TextEditWriteEventDetail } from "./types"

export const TEXTEDIT_WRITE_EVENT = "desktop:textedit-write"

const textEditorContentCache = new Map<string, string>()
const readyEditors = new Set<string>()
const readyWaiters = new Map<string, Set<(ready: boolean) => void>>()

function notifyReadyWaiters(fileId: string, ready: boolean) {
  const waiters = readyWaiters.get(fileId)
  if (!waiters) {
    return
  }

  for (const waiter of [...waiters]) {
    waiter(ready)
  }
}

export function setTextEditorContentCache(fileId: string, content: string) {
  textEditorContentCache.set(fileId, content)
}

export function clearTextEditorContentCache(fileId: string) {
  textEditorContentCache.delete(fileId)
}

export function getTextEditorContentFromCache(fileId: string) {
  return textEditorContentCache.get(fileId)
}

export function markTextEditorReady(fileId: string) {
  readyEditors.add(fileId)
  notifyReadyWaiters(fileId, true)
}

export function markTextEditorClosed(fileId: string) {
  readyEditors.delete(fileId)
}

export function isTextEditorReady(fileId: string) {
  return readyEditors.has(fileId)
}

export async function waitForTextEditorReady(fileId: string, timeoutMs = 4000): Promise<boolean> {
  if (isTextEditorReady(fileId)) {
    return true
  }

  return new Promise<boolean>((resolve) => {
    const waiters = readyWaiters.get(fileId) ?? new Set<(ready: boolean) => void>()
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const finalize = (ready: boolean) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      waiters.delete(finalize)
      if (waiters.size === 0) {
        readyWaiters.delete(fileId)
      } else {
        readyWaiters.set(fileId, waiters)
      }
      resolve(ready)
    }

    waiters.add(finalize)
    readyWaiters.set(fileId, waiters)
    timeoutId = setTimeout(() => finalize(false), timeoutMs)
  })
}

export async function readTextEditorContent(fileId: string): Promise<string> {
  const cached = getTextEditorContentFromCache(fileId)
  if (cached !== undefined) {
    return cached
  }

  const data = await filesApi.getContent(fileId)
  setTextEditorContentCache(fileId, data.content)
  return data.content
}

export function writeTextEditorContent(fileId: string, content: string) {
  setTextEditorContentCache(fileId, content)

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<TextEditWriteEventDetail>(TEXTEDIT_WRITE_EVENT, {
        detail: { fileId, content },
      })
    )
  }
}
