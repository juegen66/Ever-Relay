"use client"

import { useEffect } from "react"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { DESKTOP_COPILOT_PREDICTION_ACTION_EVENT } from "@/shared/copilot/constants"
import type { PredictionActionPayload } from "@/shared/copilot/prediction-action"

/**
 * Listens for prediction action events from the NoChatbot dashboard
 * and injects the message into the shared copilot thread.
 */
export function PredictionActionInjector() {
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const queuePendingCopilotDispatch = useDesktopAgentStore((state) => state.queuePendingCopilotDispatch)

  useEffect(() => {
    const onPredictionAction = (event: Event) => {
      const detail = (event as CustomEvent<PredictionActionPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      setCopilotSidebarOpen(true)

      queuePendingCopilotDispatch({
        id: crypto.randomUUID(),
        threadId: copilotThreadId,
        targetMode: "main",
        role: "user",
        content: message,
      })
    }

    window.addEventListener(DESKTOP_COPILOT_PREDICTION_ACTION_EVENT, onPredictionAction as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_PREDICTION_ACTION_EVENT, onPredictionAction as EventListener)
    }
  }, [copilotThreadId, queuePendingCopilotDispatch, setCopilotSidebarOpen])

  return null
}
