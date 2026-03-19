"use client"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { usePredictionReportStore } from "@/lib/stores/prediction-report-store"

export function usePredictionReportTools() {
  const setReport = usePredictionReportStore((s) => s.setReport)

  useFrontendTool(
    {
      name: "generate_prediction_report",
      description:
        "Generate and display a prediction report in the Predict Report desktop app. Pass a complete HTML document string as the report content. This will store the report and open the app window automatically.",
      followUp: false,
      parameters: [
        {
          name: "html",
          type: "string",
          description:
            "The complete HTML document string for the prediction report. Must be a self-contained single-file HTML with Tailwind CSS from CDN.",
          required: true,
        },
        {
          name: "title",
          type: "string",
          description: "Short title for the report, shown in the app title bar.",
          required: false,
        },
      ],
      handler: (args) => {
        const html = String(args.html ?? "")
        const title = String(args.title ?? "Predict Report")

        if (!html.trim()) {
          return { ok: false, error: "Empty HTML" }
        }

        setReport(html, title)

        // Defer openApp to avoid synchronous window-store mutation inside
        // the tool handler. A sync update here triggers useDesktopCoreTools
        // to re-register its tools (list_open_windows deps=[windows]),
        // which destabilises CopilotKit function references mid-run and
        // prevents finishSilentPredictionRun from being called.
        queueMicrotask(() => {
          useDesktopWindowStore.getState().openApp("report")
        })

        return { ok: true, title }
      },
    },
    [setReport]
  )
}
