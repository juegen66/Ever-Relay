"use client"

import { useEffect } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { useCodingWorkspaceStore } from "@/lib/stores/coding-workspace-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { CODING_COPILOT_AGENT } from "@/shared/copilot/constants"

export function CodingPromptInjector() {
  const { agent, isLoading, sendMessage } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const pendingPrompt = useCodingWorkspaceStore((state) => state.pendingPrompt)
  const markPromptSending = useCodingWorkspaceStore((state) => state.markPromptSending)
  const resetPrompt = useCodingWorkspaceStore((state) => state.resetPrompt)
  const consumePrompt = useCodingWorkspaceStore((state) => state.consumePrompt)

  useEffect(() => {
    if (!pendingPrompt || pendingPrompt.status !== "queued") {
      return
    }

    if (copilotAgentMode !== "coding") {
      if (isLoading) {
        return
      }

      setCopilotAgentMode("coding")
      return
    }

    if (pendingPrompt.threadId !== copilotThreadId || isLoading || agent?.agentId !== CODING_COPILOT_AGENT) {
      return
    }

    if (!markPromptSending(pendingPrompt.id)) {
      return
    }

    void sendMessage(
      {
        id: crypto.randomUUID(),
        role: "user",
        content: pendingPrompt.message,
      },
      { followUp: true }
    )
      .then(() => {
        consumePrompt(pendingPrompt.id)
      })
      .catch((error) => {
        resetPrompt(pendingPrompt.id)
        console.error("[coding-prompt-injector] Failed to send coding prompt", error)
      })
  }, [
    agent?.agentId,
    copilotAgentMode,
    consumePrompt,
    copilotThreadId,
    isLoading,
    markPromptSending,
    pendingPrompt,
    resetPrompt,
    sendMessage,
    setCopilotAgentMode,
  ])

  return null
}
