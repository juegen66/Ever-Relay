"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { logoDesignApi } from "@/lib/api/modules/logo-design"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"

import { CONFIRM_LOGO_BRIEF_PARAMS, OPEN_LOGO_SIDEBAR_PARAMS, toErrorMessage } from "./types"

export function useLogoTools() {
  const setCopilotSidebarOpen = useDesktopUIStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)

  const confirmLogoBrief = useCallback(
    async (args: { fullPrompt?: string; brandBrief?: Record<string, unknown> }) => {
      const fullPrompt = typeof args.fullPrompt === "string" ? args.fullPrompt.trim() : ""
      if (!fullPrompt) {
        return {
          ok: false,
          error: "fullPrompt is required",
        }
      }

      const brandBrief =
        typeof args.brandBrief === "object" && args.brandBrief !== null
          ? args.brandBrief
          : undefined

      try {
        const response = await logoDesignApi.triggerDesign({
          prompt: fullPrompt,
          brandBrief,
        })

        return {
          ok: true,
          runId: response.runId,
          stage: response.stage,
          status: response.status,
        }
      } catch (error) {
        return {
          ok: false,
          error: toErrorMessage(error),
        }
      }
    },
    []
  )

  const openLogoSidebar = useCallback(async (args: { reason?: string }) => {
    setCopilotAgentMode("logo")
    setCopilotSidebarOpen(true)

    const reason = typeof args.reason === "string" ? args.reason.trim() : ""
    return {
      ok: true,
      opened: true,
      reason: reason || null,
    }
  }, [setCopilotAgentMode, setCopilotSidebarOpen])

  useFrontendTool(
    {
      name: "confirm_logo_brief",
      description: "Confirm finalized logo brief and trigger backend logo workflow.",
      parameters: CONFIRM_LOGO_BRIEF_PARAMS,
      handler: async (args) => {
        return confirmLogoBrief({
          fullPrompt: typeof args.fullPrompt === "string" ? args.fullPrompt : undefined,
          brandBrief:
            typeof args.brandBrief === "object" && args.brandBrief !== null
              ? (args.brandBrief as Record<string, unknown>)
              : undefined,
        })
      },
    },
    [confirmLogoBrief]
  )

  useFrontendTool(
    {
      name: "open_logo_sidebar",
      description: "Open logo copilot sidebar for follow-up clarification questions.",
      parameters: OPEN_LOGO_SIDEBAR_PARAMS,
      handler: async (args) => {
        return openLogoSidebar({
          reason: typeof args.reason === "string" ? args.reason : undefined,
        })
      },
    },
    [openLogoSidebar]
  )
}
