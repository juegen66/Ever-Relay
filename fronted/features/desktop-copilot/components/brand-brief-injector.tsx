"use client"

import { useEffect } from "react"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import type { BrandBriefPayload } from "@/shared/copilot/brand-brief"
import { DESKTOP_COPILOT_BRAND_BRIEF_EVENT } from "@/shared/copilot/constants"

/**
 * Listens for brand brief events and injects the message into logo copilot chat.
 * Sidebar remains closed by default; logo agent can open it via open_logo_sidebar when clarification is needed.
 */
export function BrandBriefInjector() {
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const queuePendingCopilotDispatch = useDesktopAgentStore((state) => state.queuePendingCopilotDispatch)

  useEffect(() => {
    const onBrandBrief = (event: Event) => {
      const detail = (event as CustomEvent<BrandBriefPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      queuePendingCopilotDispatch({
        id: crypto.randomUUID(),
        threadId: copilotThreadId,
        targetMode: "logo",
        role: "user",
        content: message,
      })
    }

    window.addEventListener(DESKTOP_COPILOT_BRAND_BRIEF_EVENT, onBrandBrief as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_BRAND_BRIEF_EVENT, onBrandBrief as EventListener)
    }
  }, [copilotThreadId, queuePendingCopilotDispatch])

  return null
}
