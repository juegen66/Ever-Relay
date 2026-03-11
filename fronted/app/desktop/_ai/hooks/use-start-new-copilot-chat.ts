"use client"

import { useCallback } from "react"

import { useCopilotChat } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"

export function useStartNewCopilotChat() {
  const { reset, stopGeneration, isLoading } = useCopilotChat()
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const startNewCopilotThread = useDesktopAgentStore((state) => state.startNewCopilotThread)

  return useCallback(() => {
    if (isLoading) {
      stopGeneration()
    }

    reset()
    setCopilotAgentMode("main")
    startNewCopilotThread()
  }, [isLoading, reset, setCopilotAgentMode, startNewCopilotThread, stopGeneration])
}
