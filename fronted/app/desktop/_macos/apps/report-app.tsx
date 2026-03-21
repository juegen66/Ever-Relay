"use client"

import { FileBarChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePredictionReportStore } from "@/lib/stores/prediction-report-store"

function ensureHtmlDocument(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed
  return /^<!doctype html>/i.test(trimmed) ? trimmed : `<!DOCTYPE html>\n${trimmed}`
}

export function ReportApp() {
  const html = usePredictionReportStore((s) => s.html)
  const title = usePredictionReportStore((s) => s.title)

  if (!html) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
        <FileBarChart className="h-12 w-12 opacity-40" />
        <p className="text-sm">No prediction report yet.</p>
        <p className="text-xs text-neutral-300">
          A report will appear here when a high-confidence prediction is generated.
        </p>
      </div>
    )
  }

  const sandbox = "allow-scripts allow-forms allow-modals allow-popups"

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

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-black/5 px-3 py-1.5">
        <span className="text-xs font-medium text-neutral-500">{title}</span>
        <div className="flex items-center gap-1">
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

      {/* Report iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key="report"
          title={title}
          srcDoc={html}
          sandbox={sandbox}
          className="block h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  )
}
