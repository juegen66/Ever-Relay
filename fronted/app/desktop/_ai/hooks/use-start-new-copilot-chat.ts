"use client"

import { useCallback } from "react"

import { useCopilotChat } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"

export function useStartNewCopilotChat() {
  const { reset, stopGeneration, isLoading } = useCopilotChat()
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const startNewCopilotThread = useDesktopAgentStore((state) => state.startNewCopilotThread)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const clearActiveCodingApp = useDesktopAgentStore((state) => state.clearActiveCodingApp)

  return useCallback(() => {
    if (isLoading) {
      stopGeneration()
    }

    reset()

    if (activeCodingApp) {
      clearActiveCodingApp({ freshMainThread: true })
      return
    }

    setCopilotAgentMode("main")
    startNewCopilotThread()
  }, [
    activeCodingApp,
    clearActiveCodingApp,
    isLoading,
    reset,
    setCopilotAgentMode,
    startNewCopilotThread,
    stopGeneration,
  ])
}
