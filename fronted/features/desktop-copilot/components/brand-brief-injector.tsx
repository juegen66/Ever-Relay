"use client"

import { useEffect } from "react"
import { useCopilotChatInternal } from "@copilotkit/react-core"
import { DESKTOP_COPILOT_BRAND_BRIEF_EVENT } from "@/shared/copilot/constants"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import type { BrandBriefPayload } from "@/shared/copilot/brand-brief"

/**
 * Listens for brand brief events and injects the message into logo copilot chat.
 * Sidebar remains closed by default; logo agent can open it via open_logo_sidebar when clarification is needed.
 */
export function BrandBriefInjector() {
  const { sendMessage } = useCopilotChatInternal({})
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)

  useEffect(() => {
    const onBrandBrief = (event: Event) => {
      const detail = (event as CustomEvent<BrandBriefPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      setCopilotAgentMode("logo")

      void sendMessage(
        {
          id: crypto.randomUUID(),
          role: "user",
          content: message,
        },
        { followUp: true }
      )
    }

    window.addEventListener(DESKTOP_COPILOT_BRAND_BRIEF_EVENT, onBrandBrief as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_BRAND_BRIEF_EVENT, onBrandBrief as EventListener)
    }
  }, [sendMessage, setCopilotAgentMode])

  return null
}
