"use client"

import { useState } from "react"

import { FileBarChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePredictionReportStore } from "@/lib/stores/prediction-report-store"

function stripScripts(html: string): string {
  if (typeof document === "undefined") return html
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const scripts = doc.querySelectorAll("script")
    scripts.forEach((el) => el.remove())
    return doc.documentElement.outerHTML
  } catch {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  }
}

function hasScripts(html: string): boolean {
  return /<script\b/i.test(html)
}

function ensureHtmlDocument(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed
  return /^<!doctype html>/i.test(trimmed) ? trimmed : `<!DOCTYPE html>\n${trimmed}`
}

export function ReportApp() {
  const html = usePredictionReportStore((s) => s.html)
  const title = usePredictionReportStore((s) => s.title)
  const [trustScripts, setTrustScripts] = useState(false)

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

  const htmlToInject = trustScripts ? html : stripScripts(html)
  const scriptsStripped = hasScripts(html) && !trustScripts
  const sandbox = trustScripts ? "allow-scripts allow-forms allow-modals allow-popups" : ""

  const openInNewWindow = () => {
    const content = ensureHtmlDocument(trustScripts ? html : htmlToInject)
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
          {scriptsStripped && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              onClick={() => setTrustScripts(true)}
            >
              Trust & run scripts
            </Button>
          )}
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
          key={trustScripts ? "trusted-report" : "safe-report"}
          title={title}
          srcDoc={htmlToInject}
          sandbox={sandbox}
          className="block h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  )
}
