"use client"

import { useEffect } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { formatHandoffMetadata } from "@/features/desktop-copilot/lib/handoff-metadata"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"

export function HandoffMetadataInjector() {
  const { sendMessage } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const pendingHandoff = useDesktopAgentStore((state) => state.pendingHandoff)
  const markPendingHandoffSending = useDesktopAgentStore((state) => state.markPendingHandoffSending)
  const clearPendingHandoff = useDesktopAgentStore((state) => state.clearPendingHandoff)
  const resetPendingHandoff = useDesktopAgentStore((state) => state.resetPendingHandoff)

  useEffect(() => {
    if (
      !pendingHandoff ||
      pendingHandoff.threadId !== copilotThreadId ||
      pendingHandoff.targetMode !== copilotAgentMode ||
      pendingHandoff.status !== "queued"
    ) {
      return
    }

    if (!markPendingHandoffSending(pendingHandoff.id)) {
      return
    }

    void sendMessage(
      {
        id: crypto.randomUUID(),
        role: "developer",
        content: formatHandoffMetadata(pendingHandoff.metadata),
      },
      { followUp: true }
    )
      .then(() => {
        clearPendingHandoff(pendingHandoff.id)
      })
      .catch((error) => {
        resetPendingHandoff(pendingHandoff.id)
        console.error("[handoff-metadata-injector] Failed to inject handoff metadata", error)
      })
  }, [
    clearPendingHandoff,
    copilotAgentMode,
    copilotThreadId,
    markPendingHandoffSending,
    pendingHandoff,
    resetPendingHandoff,
    sendMessage,
  ])

  return null
}
