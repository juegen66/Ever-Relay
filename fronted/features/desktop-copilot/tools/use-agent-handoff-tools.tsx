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
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import {
  HANDOFF_TO_AGENT_PARAMS,
  toErrorMessage,
} from "./types"

const AGENT_ID_TO_MODE: Record<string, CopilotAgentMode> = {
  [DESKTOP_COPILOT_AGENT]: "main",
  [CODING_COPILOT_AGENT]: "coding",
  [LOGO_COPILOT_AGENT]: "logo",
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
      copilotAgentMode === "logo"
        ? LOGO_COPILOT_AGENT
        : copilotAgentMode === "coding"
          ? CODING_COPILOT_AGENT
          : DESKTOP_COPILOT_AGENT,
    [copilotAgentMode]
  )

  const handoffToAgent = useCallback(
    async (args: HandoffToolArgs) => {
      const targetAgentId = toSafeText(args.targetAgentId)
      const targetMode = AGENT_ID_TO_MODE[targetAgentId]
      if (!targetMode) {
        return {
          ok: false,
          error: `Unsupported targetAgentId: ${args.targetAgentId ?? "unknown"}`,
        }
      }

      if (targetAgentId === sourceAgentId) {
        return {
          ok: true,
          skipped: true,
          reason: "Already using target agent",
          sourceAgentId,
          targetAgentId,
          threadId: copilotThreadId,
        }
      }

      if (pendingHandoff?.threadId === copilotThreadId) {
        return {
          ok: false,
          error: "Another agent handoff is already in progress for this thread",
        }
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

        await copilotApi.prepareHandoff(body)

        queuePendingHandoff({
          id: crypto.randomUUID(),
          threadId: copilotThreadId,
          sourceAgentId,
          targetAgentId,
          targetMode,
        })
      } catch (error) {
        return {
          ok: false,
          error: toErrorMessage(error),
        }
      }

      return {
        ok: true,
        sourceAgentId,
        targetAgentId,
        threadId: copilotThreadId,
      }
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
        "Switch to another agent without changing thread id. Compressed handoff context is stored server-side and injected before the next model call.",
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
