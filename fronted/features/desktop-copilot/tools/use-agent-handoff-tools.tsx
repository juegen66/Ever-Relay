"use client"

import { useCallback, useMemo } from "react"

import {
  useCopilotChatInternal,
  useFrontendTool,
} from "@copilotkit/react-core"

import { copilotApi } from "@/lib/api/modules/copilot"
import {
  findLastMessageId,
  toApiMessages,
  type ChatMessage,
} from "@/lib/copilot/handoff-chat-messages"
import {
  useDesktopAgentStore,
  type CopilotAgentMode,
} from "@/lib/stores/desktop-agent-store"
import type { PrepareHandoffBody } from "@/shared/contracts/copilot-handoff"
import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  THIRD_PARTY_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import {
  HANDOFF_TO_AGENT_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
} from "./types"

const AGENT_ID_TO_MODE: Record<string, CopilotAgentMode> = {
  [DESKTOP_COPILOT_AGENT]: "main",
  [CANVAS_COPILOT_AGENT]: "canvas",
  [CODING_COPILOT_AGENT]: "coding",
  [LOGO_COPILOT_AGENT]: "logo",
  [THIRD_PARTY_COPILOT_AGENT]: "third_party",
}

type HandoffToolArgs = {
  targetAgentId?: string
  reason?: string
  maxTokens?: number
  task?: string
  done?: string[]
  nextSteps?: string[]
  constraints?: string[]
  artifacts?: string[]
  openQuestions?: string[]
  riskNotes?: string[]
  report?: Record<string, unknown>
}

function toSafeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => Boolean(item))
}

export function useAgentHandoffTools() {
  const { messages } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const pendingHandoff = useDesktopAgentStore((state) => state.pendingHandoff)
  const queuePendingHandoff = useDesktopAgentStore((state) => state.queuePendingHandoff)

  const sourceAgentId = useMemo(
    () =>
      copilotAgentMode === "canvas"
        ? CANVAS_COPILOT_AGENT
        : copilotAgentMode === "logo"
        ? LOGO_COPILOT_AGENT
        : copilotAgentMode === "coding"
          ? CODING_COPILOT_AGENT
          : copilotAgentMode === "third_party"
            ? THIRD_PARTY_COPILOT_AGENT
          : DESKTOP_COPILOT_AGENT,
    [copilotAgentMode]
  )

  const handoffToAgent = useCallback(
    async (args: HandoffToolArgs) => {
      const targetAgentId = toSafeText(args.targetAgentId)
      const targetMode = AGENT_ID_TO_MODE[targetAgentId]
      if (!targetMode) {
        return toolErr(
          `Unsupported targetAgentId: ${args.targetAgentId ?? "unknown"}`,
          {},
          {
            nextAction: "reply_to_user",
          }
        )
      }

      if (targetAgentId === sourceAgentId) {
        return toolOk(
          "Succeeded: no handoff needed — already on the target agent.",
          {
            skipped: true,
            reason: "Already using target agent",
            sourceAgentId,
            targetAgentId,
            threadId: copilotThreadId,
          },
          {
            shouldStop: true,
            nextAction: "reply_to_user",
          }
        )
      }

      if (pendingHandoff?.threadId === copilotThreadId) {
        return toolErr(
          "Another agent handoff is already in progress for this thread",
          {},
          {
            status: "retry_later",
            retryable: true,
            nextAction: "wait_for_handoff",
          }
        )
      }

      try {
        const snapshotMessages = messages as ChatMessage[]
        const body: PrepareHandoffBody = {
          targetAgentId,
          sourceAgentId,
          threadId: copilotThreadId,
          lastMessageId: findLastMessageId(snapshotMessages),
          reason: toSafeText(args.reason) || undefined,
          maxTokens:
            typeof args.maxTokens === "number" && Number.isFinite(args.maxTokens)
              ? args.maxTokens
              : undefined,
          task: toSafeText(args.task) || undefined,
          done: toStringList(args.done),
          nextSteps: toStringList(args.nextSteps),
          constraints: toStringList(args.constraints),
          artifacts: toStringList(args.artifacts),
          openQuestions: toStringList(args.openQuestions),
          riskNotes: toStringList(args.riskNotes),
          report:
            typeof args.report === "object" && args.report !== null
              ? (args.report as PrepareHandoffBody["report"])
              : undefined,
          messages: toApiMessages(snapshotMessages),
        }

        const handoffData = await copilotApi.prepareHandoff(body)

        queuePendingHandoff({
          id: crypto.randomUUID(),
          threadId: copilotThreadId,
          sourceAgentId,
          targetAgentId,
          targetMode,
          handoffDocument: handoffData.handoffDocument,
          reason: toSafeText(args.reason) || undefined,
          task: toSafeText(args.task) || undefined,
        })
      } catch (error) {
        return toolErr(toErrorMessage(error))
      }

      return toolOk(
        `Succeeded: handoff prepared server-side and returned to the frontend; the UI will switch to ${targetAgentId} on the same thread (${copilotThreadId}).`,
        {
          sourceAgentId,
          targetAgentId,
          threadId: copilotThreadId,
        },
        {
          shouldStop: true,
          nextAction: "wait_for_handoff",
        }
      )
    },
    [
      copilotThreadId,
      messages,
      pendingHandoff,
      queuePendingHandoff,
      sourceAgentId,
    ]
  )

  useFrontendTool(
    {
      name: "handoff_to_agent",
      description:
        "Switch to another agent without changing thread id. Compressed handoff context is prepared server-side, returned to the frontend, then replayed back to the target agent after mode switch.",
      followUp: false,
      parameters: HANDOFF_TO_AGENT_PARAMS,
      handler: async (args) => {
        const result = await handoffToAgent({
          targetAgentId:
            typeof args.targetAgentId === "string"
              ? args.targetAgentId
              : undefined,
          reason: typeof args.reason === "string" ? args.reason : undefined,
          maxTokens: typeof args.maxTokens === "number" ? args.maxTokens : undefined,
          task: typeof args.task === "string" ? args.task : undefined,
          done: toStringList(args.done),
          nextSteps: toStringList(args.nextSteps),
          constraints: toStringList(args.constraints),
          artifacts: toStringList(args.artifacts),
          openQuestions: toStringList(args.openQuestions),
          riskNotes: toStringList(args.riskNotes),
          report:
            typeof args.report === "object" && args.report !== null
              ? (args.report as Record<string, unknown>)
              : undefined,
        })
        return result
      },
    },
    [handoffToAgent]
  )
}
