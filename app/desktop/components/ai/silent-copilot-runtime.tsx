"use client"

import { useEffect, useRef } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import {
  DESKTOP_COPILOT_SILENT_CHAT_ID,
  DESKTOP_COPILOT_SILENT_EVENT,
} from "@/shared/copilot/constants"
import type { SilentCopilotMessagePayload } from "@/shared/copilot/silent"

function toUserText(input: string) {
  return input.trim()
}

export function SilentCopilotRuntime() {
  const { sendMessage, reset } = useCopilotChatInternal({
    id: DESKTOP_COPILOT_SILENT_CHAT_ID,
  })
  const queueRef = useRef(Promise.resolve())

  useEffect(() => {
    const onSilentSend = (event: Event) => {
      const detail = (event as CustomEvent<SilentCopilotMessagePayload>).detail
      const message = toUserText(detail?.message ?? "")
      if (!message) {
        return
      }

      queueRef.current = queueRef.current
        .then(async () => {
          await sendMessage(
            {
              id: crypto.randomUUID(),
              role: "user",
              content: message,
            },
            {
              followUp: detail?.followUp ?? true,
            }
          )

          if (detail?.resetAfterRun ?? true) {
            reset()
          }
        })
        .catch((error) => {
          console.error("[silent-copilot-runtime] Failed to send silent message", error)
        })
    }

    window.addEventListener(DESKTOP_COPILOT_SILENT_EVENT, onSilentSend as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_SILENT_EVENT, onSilentSend as EventListener)
    }
  }, [reset, sendMessage])

  return null
}
