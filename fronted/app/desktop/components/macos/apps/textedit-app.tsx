"use client"

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { ApiError } from "@/lib/api"
import { filesApi } from "@/lib/api/modules/files"
import {
  clearTextEditorContentCache,
  markTextEditorClosed,
  markTextEditorReady,
  setTextEditorContentCache,
  TEXTEDIT_WRITE_EVENT,
  type TextEditWriteEventDetail,
} from "@/lib/textedit-content"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface TextEditAppProps {
  fileId: string
  fileName: string
}

function parseConflictExpectedVersion(error: ApiError): number | undefined {
  if (error.status !== 409 || !error.details || typeof error.details !== "object") {
    return undefined
  }

  const payload = error.details as {
    data?: {
      expectedVersion?: unknown
    }
  }

  return typeof payload?.data?.expectedVersion === "number"
    ? payload.data.expectedVersion
    : undefined
}

export function TextEditApp({ fileId, fileName }: TextEditAppProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef("")
  const loadedRef = useRef(false)
  const dirtyRef = useRef(false)
  const externalWriteDuringLoadRef = useRef(false)
  const contentVersionRef = useRef(1)
  const inFlightSaveRef = useRef(false)
  const pendingSaveTextRef = useRef<string | null>(null)

  // Load file content
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setSaveError(null)
      loadedRef.current = false
      dirtyRef.current = false
      externalWriteDuringLoadRef.current = false
      contentVersionRef.current = 1
      inFlightSaveRef.current = false
      pendingSaveTextRef.current = null
      try {
        const data = await filesApi.getContent(fileId)
        if (!cancelled) {
          contentVersionRef.current = data.contentVersion
          if (!externalWriteDuringLoadRef.current) {
            setContent(data.content)
            latestContentRef.current = data.content
            setTextEditorContentCache(fileId, data.content)
          }
          loadedRef.current = true
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load file content")
          console.error("Failed to load file content:", err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [fileId])

  const runSaveLoop = useCallback(async () => {
    if (!loadedRef.current) return

    if (inFlightSaveRef.current) {
      return
    }

    inFlightSaveRef.current = true
    setSaving(true)

    try {
      while (pendingSaveTextRef.current !== null) {
        const textToSave = pendingSaveTextRef.current
        pendingSaveTextRef.current = null

        try {
          const result = await filesApi.updateContent(
            fileId,
            textToSave,
            contentVersionRef.current
          )
          contentVersionRef.current = result.contentVersion
          setTextEditorContentCache(fileId, textToSave)
          setSaveError(null)

          if (latestContentRef.current === textToSave) {
            dirtyRef.current = false
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const expectedVersion = parseConflictExpectedVersion(err)
            if (expectedVersion !== undefined) {
              contentVersionRef.current = expectedVersion
            }

            try {
              const latest = await filesApi.getContent(fileId)
              setContent(latest.content)
              latestContentRef.current = latest.content
              contentVersionRef.current = latest.contentVersion
              dirtyRef.current = false
              setTextEditorContentCache(fileId, latest.content)
            } catch {
              // no-op, keep existing UI state and only report conflict
            }

            setSaveError("Conflict detected. Loaded the latest content from server.")
          } else {
            setSaveError("Failed to save file content")
          }
          break
        }
      }
    } finally {
      inFlightSaveRef.current = false
      setSaving(false)
      if (pendingSaveTextRef.current !== null) {
        void runSaveLoop()
      }
    }
  }, [fileId])

  const scheduleSave = useCallback((text: string) => {
    if (!loadedRef.current) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      pendingSaveTextRef.current = text
      void runSaveLoop()
    }, 1000)
  }, [runSaveLoop])

  const handleChange = useCallback((value?: string, event?: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined && !event) return
    const text = value ?? ""

    if (text === latestContentRef.current) return

    setContent(text)
    latestContentRef.current = text
    setTextEditorContentCache(fileId, text)
    dirtyRef.current = loadedRef.current
    setSaveError(null)

    scheduleSave(text)
  }, [fileId, scheduleSave])

  // Receive external writes from frontend tools
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleExternalWrite = (event: Event) => {
      const customEvent = event as CustomEvent<TextEditWriteEventDetail>
      const detail = customEvent.detail
      if (!detail || detail.fileId !== fileId) {
        return
      }

      const nextContent = detail.content ?? ""
      if (nextContent === latestContentRef.current) {
        return
      }

      externalWriteDuringLoadRef.current = true
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      setContent(nextContent)
      latestContentRef.current = nextContent
      setTextEditorContentCache(fileId, nextContent)
      loadedRef.current = true
      dirtyRef.current = true
      setSaveError(null)
      scheduleSave(nextContent)
    }

    window.addEventListener(TEXTEDIT_WRITE_EVENT, handleExternalWrite)
    markTextEditorReady(fileId)
    return () => {
      window.removeEventListener(TEXTEDIT_WRITE_EVENT, handleExternalWrite)
      markTextEditorClosed(fileId)
    }
  }, [fileId, scheduleSave])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      // Fire final save
      if (loadedRef.current && dirtyRef.current && !inFlightSaveRef.current) {
        void filesApi
          .updateContent(fileId, latestContentRef.current, contentVersionRef.current)
          .catch(() => {})
      }
      clearTextEditorContentCache(fileId)
    }
  }, [fileId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#999]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[14px] text-[#999]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-[13px] text-[#007aff] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white" data-color-mode="light">
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <span className="text-[11px] text-[#999]">{fileName}</span>
        <span className="text-[11px] text-[#999]">
          {saving ? "Saving..." : saveError ? "Conflict" : "Saved"}
        </span>
      </div>
      {saveError ? (
        <div className="border-b border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-600">
          {saveError}
        </div>
      ) : null}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          visibleDragbar={false}
          preview="live"
          style={{ height: "100%", background: "white" }}
        />
      </div>
    </div>
  )
}
