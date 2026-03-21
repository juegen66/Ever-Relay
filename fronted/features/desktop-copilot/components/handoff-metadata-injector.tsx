"use client"

import { useEffect } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import {
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

function resolveAgentIdForMode(mode: "main" | "logo" | "coding") {
  if (mode === "logo") {
    return LOGO_COPILOT_AGENT
  }

  if (mode === "coding") {
    return CODING_COPILOT_AGENT
  }

  return DESKTOP_COPILOT_AGENT
}

/**
 * Handles two concerns:
 * 1. Pending handoff — switches agent mode; CopilotKit replays the user
 *    message automatically when the `agent` prop changes, so we do NOT
 *    send an extra trigger message (that would cause a duplicate run).
 *    The HandoffContextProcessor on the backend injects the compressed
 *    handoff context as a system message before the model sees it.
 * 2. Pending copilot dispatch — sends a queued message after mode switch.
 */
export function HandoffMetadataInjector() {
  const { agent, isLoading, sendMessage } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const pendingHandoff = useDesktopAgentStore((state) => state.pendingHandoff)
  const pendingCopilotDispatch = useDesktopAgentStore((state) => state.pendingCopilotDispatch)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const markPendingHandoffSwitching = useDesktopAgentStore((state) => state.markPendingHandoffSwitching)
  const clearPendingHandoff = useDesktopAgentStore((state) => state.clearPendingHandoff)
  const markPendingCopilotDispatchSending = useDesktopAgentStore(
    (state) => state.markPendingCopilotDispatchSending
  )
  const clearPendingCopilotDispatch = useDesktopAgentStore((state) => state.clearPendingCopilotDispatch)
  const resetPendingCopilotDispatch = useDesktopAgentStore((state) => state.resetPendingCopilotDispatch)

  // ---- Handoff: switch mode only, no extra message ----
  useEffect(() => {
    if (!pendingHandoff || pendingHandoff.threadId !== copilotThreadId) {
      return
    }

    if (pendingHandoff.status === "queued") {
      if (isLoading || agent?.agentId !== pendingHandoff.sourceAgentId) {
        return
      }

      if (!markPendingHandoffSwitching(pendingHandoff.id)) {
        return
      }

      setCopilotAgentMode(pendingHandoff.targetMode)
      return
    }

    // Once mode has switched and CopilotKit has mounted the target agent,
    // the handoff is complete. CopilotKit will replay the user's original
    // message; the HandoffContextProcessor injects the DB context.
    if (pendingHandoff.status === "switching") {
      if (agent?.agentId === pendingHandoff.targetAgentId) {
        clearPendingHandoff(pendingHandoff.id)
      }
    }
  }, [
    agent?.agentId,
    clearPendingHandoff,
    copilotThreadId,
    isLoading,
    markPendingHandoffSwitching,
    pendingHandoff,
    setCopilotAgentMode,
  ])

  // ---- Copilot dispatch: send queued message after mode switch ----
  useEffect(() => {
    if (!pendingCopilotDispatch || pendingCopilotDispatch.status !== "queued") {
      return
    }

    if (pendingCopilotDispatch.threadId !== copilotThreadId) {
      return
    }

    if (pendingHandoff?.threadId === copilotThreadId) {
      return
    }

    if (copilotAgentMode !== pendingCopilotDispatch.targetMode) {
      if (isLoading) {
        return
      }

      setCopilotAgentMode(pendingCopilotDispatch.targetMode)
      return
    }

    const targetAgentId = resolveAgentIdForMode(pendingCopilotDispatch.targetMode)
    if (isLoading || agent?.agentId !== targetAgentId) {
      return
    }

    if (!markPendingCopilotDispatchSending(pendingCopilotDispatch.id)) {
      return
    }

    void sendMessage(
      {
        id: crypto.randomUUID(),
        role: pendingCopilotDispatch.role,
        content: pendingCopilotDispatch.content,
      },
      { followUp: true }
    )
      .then(() => {
        clearPendingCopilotDispatch(pendingCopilotDispatch.id)
      })
      .catch((error) => {
        resetPendingCopilotDispatch(pendingCopilotDispatch.id)
        console.error("[handoff-metadata-injector] Failed to send queued copilot dispatch", error)
      })
  }, [
    agent?.agentId,
    clearPendingCopilotDispatch,
    copilotAgentMode,
    copilotThreadId,
    isLoading,
    markPendingCopilotDispatchSending,
    pendingHandoff,
    pendingCopilotDispatch,
    resetPendingCopilotDispatch,
    sendMessage,
    setCopilotAgentMode,
  ])

  return null
}
