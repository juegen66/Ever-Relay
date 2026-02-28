"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"

interface ApprovalCardProps {
  title: string
  summary: string
  status: "inProgress" | "executing" | "complete"
  onApprove?: () => Promise<void>
  onReject?: () => void
  result?: unknown
}

function formatResult(result: unknown) {
  if (!result) return "No result"
  if (typeof result === "string") return result

  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return "Result is not serializable"
  }
}

export function ApprovalCard({ title, summary, status, onApprove, onReject, result }: ApprovalCardProps) {
  const [submitting, setSubmitting] = useState(false)

  const resultText = useMemo(() => formatResult(result), [result])

  return (
    <div className="my-2 rounded-lg border border-black/10 bg-white/85 p-3 text-xs text-neutral-700 shadow-sm">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">{summary}</p>

      {status === "executing" && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            disabled={submitting}
            onClick={async () => {
              if (!onApprove) return
              setSubmitting(true)
              try {
                await onApprove()
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? "Running..." : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            disabled={submitting}
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      )}

      {status === "inProgress" && (
        <div className="mt-2 text-[11px] text-neutral-500">Waiting for execution payload...</div>
      )}

      {status === "complete" && (
        <pre className="mt-3 overflow-x-auto rounded border border-black/5 bg-neutral-50 p-2 text-[11px] text-neutral-700">
          {resultText}
        </pre>
      )}
    </div>
  )
}
