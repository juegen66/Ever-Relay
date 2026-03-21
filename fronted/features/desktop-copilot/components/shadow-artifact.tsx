"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

function ensureHtmlDocument(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed
  return /^<!doctype html>/i.test(trimmed) ? trimmed : `<!DOCTYPE html>\n${trimmed}`
}

interface ShadowArtifactProps {
  html: string
  title?: string
  status?: string
}

export function ShadowArtifact({ html, title = "Artifact", status }: ShadowArtifactProps) {
  const [expanded, setExpanded] = useState(true)

  const openInNewWindow = () => {
    const content = ensureHtmlDocument(html)
    if (!content) return

    const artifactUrl = URL.createObjectURL(
      new Blob([content], { type: "text/html;charset=utf-8" })
    )

    const win = window.open(artifactUrl, "_blank", "noopener,noreferrer")
    if (!win) {
      URL.revokeObjectURL(artifactUrl)
      return
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(artifactUrl)
    }, 60_000)
  }

  const isEmpty = !html?.trim()
  const isInProgress = status === "inProgress"
  const sandbox = "allow-scripts allow-forms allow-modals allow-popups"

  return (
    <div className="shadow-artifact-card my-2 overflow-hidden rounded-lg border border-black/10 bg-white/85 text-xs text-neutral-700 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
        <span className="truncate text-sm font-semibold text-neutral-900">{title}</span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={openInNewWindow}
          >
            Open in new window
          </Button>
        </div>
      </div>

      {isInProgress && (
        <div className="px-3 py-4 text-[11px] text-neutral-500">Loading artifact...</div>
      )}

      {!isInProgress && isEmpty && (
        <div className="px-3 py-4 text-[11px] text-neutral-500">No content to display.</div>
      )}

      {!isInProgress && !isEmpty && (
        <div
          className="overflow-auto transition-[max-height] duration-300 ease-out"
          style={{ maxHeight: expanded ? "480px" : "0" }}
        >
          <iframe
            key="artifact"
            title={title}
            srcDoc={html}
            sandbox={sandbox}
            className="block min-h-[80px] w-full border-0 bg-white"
            style={{ height: "480px" }}
          />
        </div>
      )}
    </div>
  )
}
