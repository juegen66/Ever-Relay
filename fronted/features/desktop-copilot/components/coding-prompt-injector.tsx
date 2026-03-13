"use client"

import { useEffect } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { useCodingWorkspaceStore } from "@/lib/stores/coding-workspace-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"

export function CodingPromptInjector() {
  const { sendMessage } = useCopilotChatInternal({})
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const pendingPrompt = useCodingWorkspaceStore((state) => state.pendingPrompt)
  const markPromptSending = useCodingWorkspaceStore((state) => state.markPromptSending)
  const resetPrompt = useCodingWorkspaceStore((state) => state.resetPrompt)
  const consumePrompt = useCodingWorkspaceStore((state) => state.consumePrompt)

  useEffect(() => {
    if (
      !pendingPrompt ||
      pendingPrompt.threadId !== copilotThreadId ||
      pendingPrompt.status !== "queued"
    ) {
      return
    }

    if (!markPromptSending(pendingPrompt.id)) {
      return
    }

    setCopilotAgentMode("coding")

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
    consumePrompt,
    copilotThreadId,
    markPromptSending,
    pendingPrompt,
    resetPrompt,
    sendMessage,
    setCopilotAgentMode,
  ])

  return null
}
