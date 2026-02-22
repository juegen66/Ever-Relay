"use client"

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { filesApi } from "@/lib/api/modules/files"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface TextEditAppProps {
  fileId: string
  fileName: string
}

export function TextEditApp({ fileId, fileName }: TextEditAppProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef("")
  const loadedRef = useRef(false)
  const dirtyRef = useRef(false)

  // Load file content
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      loadedRef.current = false
      dirtyRef.current = false
      try {
        const data = await filesApi.getContent(fileId)
        if (!cancelled) {
          setContent(data.content)
          latestContentRef.current = data.content
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

  // Auto-save with debounce
  const saveContent = useCallback(async (text: string) => {
    if (!loadedRef.current) return
    setSaving(true)
    try {
      await filesApi.updateContent(fileId, text)
      if (latestContentRef.current === text) {
        dirtyRef.current = false
      }
    } catch (err) {
      console.error("Failed to save file content:", err)
    } finally {
      setSaving(false)
    }
  }, [fileId])

  const handleChange = useCallback((value?: string, event?: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined && !event) return
    const text = value ?? ""

    if (text === latestContentRef.current) return

    setContent(text)
    latestContentRef.current = text
    dirtyRef.current = loadedRef.current

    // Debounced save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveContent(text)
    }, 1000)
  }, [saveContent])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      // Fire final save
      if (loadedRef.current && dirtyRef.current) {
        filesApi.updateContent(fileId, latestContentRef.current).catch(() => {})
      }
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
          {saving ? "Saving..." : "Saved"}
        </span>
      </div>

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
