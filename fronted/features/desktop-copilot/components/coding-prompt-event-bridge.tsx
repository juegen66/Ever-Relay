"use client"

import { useEffect } from "react"

import { useCodingWorkspaceStore } from "@/lib/stores/coding-workspace-store"
import type { CodingPromptPayload } from "@/shared/copilot/coding-prompt"
import { DESKTOP_COPILOT_CODING_PROMPT_EVENT } from "@/shared/copilot/constants"

export function CodingPromptEventBridge() {
  useEffect(() => {
    const onCodingPrompt = (event: Event) => {
      const detail = (event as CustomEvent<CodingPromptPayload>).detail
      const appId = detail?.appId?.trim()
      const threadId = detail?.threadId?.trim()
      const message = detail?.message?.trim()

      if (!appId || !threadId || !message) {
        return
      }

      useCodingWorkspaceStore.getState().queuePrompt({
        appId,
        threadId,
        message,
      })
    }

    window.addEventListener(
      DESKTOP_COPILOT_CODING_PROMPT_EVENT,
      onCodingPrompt as EventListener
    )

    return () => {
      window.removeEventListener(
        DESKTOP_COPILOT_CODING_PROMPT_EVENT,
        onCodingPrompt as EventListener
      )
    }
  }, [])

  return null
}
