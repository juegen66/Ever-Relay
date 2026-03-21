"use client"

import { useEffect, useRef } from "react"

import { useCopilotChatInternal } from "@copilotkit/react-core"

import { useDesktopAgentStore, type PendingHandoff } from "@/lib/stores/desktop-agent-store"
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

/** Phase 2: sent via PendingCopilotDispatch with followUp: true after handoff context is replayed. */
const HANDOFF_GREETING_FOLLOWUP_INSTRUCTION =
  "You have just been activated via agent handoff. " +
  "Greet the user briefly, summarize what you know from the handoff context, " +
  "and explain what you can help with. Always produce a visible text reply."

/** Phase 1: replay handoff context only (followUp: false) — avoids parallel runAgent during mode switch. */
function buildHandoffGreeting(handoff: PendingHandoff): string {
  const parts: string[] = [
    "[HANDOFF_CONTEXT_VIA_FRONTEND]",
    "The following handoff document was prepared server-side and replayed through the frontend because the backend handoff processor is currently disabled.",
    "Treat it as authoritative context for this turn and continue from it.",
    "",
  ]

  if (handoff.reason) {
    parts.push(`Handoff reason: ${handoff.reason}`)
    parts.push("")
  }

  parts.push(handoff.handoffDocument)
  parts.push("")
  parts.push("You have been activated via agent handoff. Await further instructions.")

  return parts.join("\n")
}

/**
 * Handles two concerns:
 * 1. Pending handoff — switches agent mode, replays handoff context as a
 *    developer message (followUp: false),
 *    then queues PendingCopilotDispatch with a greeting instruction (followUp: true)
 *    so the new agent replies without racing parallel requests during the switch.
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
  const queuePendingCopilotDispatch = useDesktopAgentStore((state) => state.queuePendingCopilotDispatch)
  const markPendingCopilotDispatchSending = useDesktopAgentStore(
    (state) => state.markPendingCopilotDispatchSending
  )
  const clearPendingCopilotDispatch = useDesktopAgentStore((state) => state.clearPendingCopilotDispatch)
  const resetPendingCopilotDispatch = useDesktopAgentStore((state) => state.resetPendingCopilotDispatch)

  const handoffGreetingSentRef = useRef<string | null>(null)

  // ---- Handoff: switch mode, then trigger greeting ----
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

      handoffGreetingSentRef.current = null
      setCopilotAgentMode(pendingHandoff.targetMode)
      return
    }

    if (pendingHandoff.status === "switching") {
      if (agent?.agentId !== pendingHandoff.targetAgentId) {
        return
      }

      if (isLoading) {
        return
      }

      if (handoffGreetingSentRef.current === pendingHandoff.id) {
        return
      }

      handoffGreetingSentRef.current = pendingHandoff.id
      const greeting = buildHandoffGreeting(pendingHandoff)
      const handoffId = pendingHandoff.id
      const dispatchTargetMode = pendingHandoff.targetMode
      const dispatchThreadId = copilotThreadId

      void sendMessage(
        {
          id: crypto.randomUUID(),
          role: "developer",
          content: greeting,
        },
        { followUp: false }
      )
        .then(() => {
          clearPendingHandoff(handoffId)
          queuePendingCopilotDispatch({
            id: crypto.randomUUID(),
            threadId: dispatchThreadId,
            targetMode: dispatchTargetMode,
            role: "developer",
            content: HANDOFF_GREETING_FOLLOWUP_INSTRUCTION,
          })
        })
        .catch((error) => {
          console.error("[handoff-metadata-injector] Failed to send handoff greeting", error)
          clearPendingHandoff(handoffId)
        })
    }
  }, [
    agent?.agentId,
    clearPendingHandoff,
    copilotThreadId,
    isLoading,
    markPendingHandoffSwitching,
    pendingHandoff,
    queuePendingCopilotDispatch,
    sendMessage,
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
