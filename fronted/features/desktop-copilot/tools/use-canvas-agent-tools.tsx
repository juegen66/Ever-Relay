"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"

import {
  OPEN_CANVAS_SIDEBAR_PARAMS,
  toolOk,
} from "./types"

export function useCanvasAgentTools() {
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)

  const openCanvasSidebar = useCallback(async (args: { reason?: string }) => {
    setCopilotAgentMode("canvas")
    setCopilotSidebarOpen(true)

    const reason = typeof args.reason === "string" ? args.reason.trim() : ""

    return toolOk(
      "Succeeded: canvas sidebar is open and agent mode is set to canvas.",
      {
        opened: true,
        reason: reason || null,
      },
      {
        nextAction: "ask_user_follow_up",
      }
    )
  }, [setCopilotAgentMode, setCopilotSidebarOpen])

  useFrontendTool(
    {
      name: "open_canvas_sidebar",
      description: "Open the Canvas copilot sidebar so canvas-specific follow-up can happen there.",
      parameters: OPEN_CANVAS_SIDEBAR_PARAMS,
      handler: async (args) => {
        return openCanvasSidebar({
          reason: typeof args.reason === "string" ? args.reason : undefined,
        })
      },
    },
    [openCanvasSidebar]
  )
}
