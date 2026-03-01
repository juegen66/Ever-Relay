"use client"

import { useCallback } from "react"
import { useCopilotChat } from "@copilotkit/react-core"

import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"

export function useStartNewCopilotChat() {
  const { reset, stopGeneration, isLoading } = useCopilotChat()
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)
  const startNewCopilotThread = useDesktopUIStore((state) => state.startNewCopilotThread)

  return useCallback(() => {
    if (isLoading) {
      stopGeneration()
    }

    reset()
    setCopilotAgentMode("main")
    startNewCopilotThread()
  }, [isLoading, reset, setCopilotAgentMode, startNewCopilotThread, stopGeneration])
}
