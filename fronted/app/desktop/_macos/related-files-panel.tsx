"use client"

import { useMemo, useState } from "react"

import { ChevronRight, FileText, Link2 } from "lucide-react"

import { useWorkingMemoryStore } from "@/lib/stores/working-memory-store"

interface RelatedFilesPanelProps {
  currentFileName: string | null
  onOpenFile?: (fileName: string) => void
}

export function RelatedFilesPanel({ currentFileName, onOpenFile }: RelatedFilesPanelProps) {
  const state = useWorkingMemoryStore((s) => s.state)
  const [expanded, setExpanded] = useState(true)
  const recentConnections = state?.recentConnections

  const relatedFiles = useMemo(() => {
    if (!currentFileName || !recentConnections || recentConnections.length === 0) return []

    const normalizedName = currentFileName.toLowerCase()
    return recentConnections.filter((conn) => {
      return (
        conn.itemA.toLowerCase().includes(normalizedName) ||
        conn.itemB.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(conn.itemA.toLowerCase()) ||
        normalizedName.includes(conn.itemB.toLowerCase())
      )
    }).map((conn) => {
      const isA = conn.itemA.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(conn.itemA.toLowerCase())
      return {
        name: isA ? conn.itemB : conn.itemA,
        relation: conn.relation,
      }
    })
  }, [currentFileName, recentConnections])

  if (relatedFiles.length === 0) {
    return null
  }

  return (
    <div className="border-l border-black/10 bg-[#f8f8fa]">
      <button
        className="flex w-full items-center gap-1.5 border-b border-black/10 px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={`h-3 w-3 text-[#999] transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <Link2 className="h-3 w-3 text-[#999]" />
        <span className="text-[11px] font-semibold text-[#666]">
          Related ({relatedFiles.length})
        </span>
      </button>

      {expanded && (
        <div className="space-y-0.5 p-2">
          {relatedFiles.map((file, index) => (
            <button
              key={index}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-black/5"
              onClick={() => onOpenFile?.(file.name)}
            >
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#aaa]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-[#333]">{file.name}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-[#999]">{file.relation}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
