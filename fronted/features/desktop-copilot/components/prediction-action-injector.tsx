"use client"

import { useEffect } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import type { PredictionActionPayload } from "@/shared/copilot/prediction-action"
import { DESKTOP_COPILOT_PREDICTION_ACTION_EVENT } from "@/shared/copilot/constants"

/**
 * Listens for prediction action events from the NoChatbot dashboard
 * and injects the message into the shared copilot thread.
 */
export function PredictionActionInjector() {
  const { sendMessage } = useCopilotChatInternal({})
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)

  useEffect(() => {
    const onPredictionAction = (event: Event) => {
      const detail = (event as CustomEvent<PredictionActionPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      setCopilotAgentMode("main")
      setCopilotSidebarOpen(true)

      void sendMessage(
        {
          id: crypto.randomUUID(),
          role: "user",
          content: message,
        },
        { followUp: true }
      )
    }

    window.addEventListener(DESKTOP_COPILOT_PREDICTION_ACTION_EVENT, onPredictionAction as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_PREDICTION_ACTION_EVENT, onPredictionAction as EventListener)
    }
  }, [sendMessage, setCopilotAgentMode, setCopilotSidebarOpen])

  return null
}
