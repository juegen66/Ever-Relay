"use client"

import { useCallback, useMemo } from "react"

import {
  useCopilotChat,
  useCopilotChatInternal,
  useFrontendTool,
} from "@copilotkit/react-core"

import { copilotApi } from "@/lib/api/modules/copilot"
import {
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"
import type {
  CopilotHandoffMessage,
  PrepareHandoffBody,
} from "@/shared/contracts/copilot-handoff"
import { type HandoffMetadata } from "@/shared/copilot/handoff"
import {
  useDesktopUIStore,
  type CopilotAgentMode,
} from "@/lib/stores/desktop-ui-store"
import {
  HANDOFF_TO_AGENT_PARAMS,
  toErrorMessage,
} from "./types"

const AGENT_ID_TO_MODE: Record<string, CopilotAgentMode> = {
  [DESKTOP_COPILOT_AGENT]: "main",
  [LOGO_COPILOT_AGENT]: "logo",
}

const MAX_SUMMARY_INPUT_MESSAGES = 60

type ChatMessage = {
  id?: string
  role?: string
  name?: unknown
  content?: unknown
  toolCalls?: unknown
  toolCallId?: unknown
  error?: unknown
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

function toMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim()
  }

  if (!Array.isArray(content)) {
    return ""
  }

  const textParts = content
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const record = item as Record<string, unknown>
      if (record.type !== "text") return ""
      return typeof record.text === "string" ? record.text : ""
    })
    .filter((item) => Boolean(item))

  return textParts.join("\n").trim()
}

function toHandoffMessageRole(role: unknown): CopilotHandoffMessage["role"] | null {
  const normalized = toSafeText(role).toLowerCase()

  if (normalized === "user") return "user"
  if (normalized === "assistant") return "assistant"
  if (normalized === "developer") return "developer"
  if (normalized === "system") return "system"
  if (normalized === "tool") return "tool"
  if (normalized === "activity") return "activity"

  return null
}

function toApiMessages(messages: ChatMessage[]): CopilotHandoffMessage[] {
  return messages
    .map((message) => {
      const role = toHandoffMessageRole(message.role)
      const content = toMessageText(message.content)
      if (!role || !content) {
        return null
      }

      return { role, content }
    })
    .filter((message): message is CopilotHandoffMessage => message !== null)
    .slice(-MAX_SUMMARY_INPUT_MESSAGES)
}

function findLastMessageId(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = toSafeText(messages[index]?.id)
    if (candidate) {
      return candidate
    }
  }
  return undefined
}

function pruneMessagesBeforeId(messages: ChatMessage[], messageId: string | null) {
  if (!messageId) {
    return messages
  }

  const cutoffIndex = messages.findIndex(
    (message) => toSafeText(message.id) === messageId
  )
  if (cutoffIndex <= 0) {
    return messages
  }

  return messages.slice(cutoffIndex)
}

function toOptionalString(value: unknown) {
  const text = toSafeText(value)
  return text || undefined
}

type SerializableToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

function toSerializableToolCalls(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined
  }

  const toolCalls = value
    .map((item): SerializableToolCall | null => {
      if (!item || typeof item !== "object") {
        return null
      }

      const record = item as Record<string, unknown>
      const callId = toOptionalString(record.id)
      const fnRecord =
        record.function && typeof record.function === "object"
          ? (record.function as Record<string, unknown>)
          : null
      const fnName = toOptionalString(fnRecord?.name)

      if (!callId || !fnName) {
        return null
      }

      const rawArguments = fnRecord?.arguments
      let fnArgs = "{}"
      if (typeof rawArguments === "string") {
        fnArgs = rawArguments
      } else if (rawArguments !== undefined) {
        try {
          fnArgs = JSON.stringify(rawArguments)
        } catch {
          fnArgs = "{}"
        }
      }

      return {
        id: callId,
        type: "function",
        function: {
          name: fnName,
          arguments: fnArgs,
        },
      }
    })
    .filter((toolCall): toolCall is SerializableToolCall => toolCall !== null)

  return toolCalls.length > 0 ? toolCalls : undefined
}

type SerializableUserContentPart =
  | {
      type: "text"
      text: string
    }
  | {
      type: "binary"
      mimeType: string
      id?: string
      url?: string
      data?: string
      filename?: string
    }

function toSerializableUserContent(content: unknown): string | SerializableUserContentPart[] {
  if (typeof content === "string") {
    return content
  }

  if (!Array.isArray(content)) {
    return toMessageText(content)
  }

  const parts = content
    .map((item): SerializableUserContentPart | null => {
      if (!item || typeof item !== "object") {
        return null
      }

      const record = item as Record<string, unknown>
      const type = toSafeText(record.type).toLowerCase()

      if (type === "text") {
        const text = toOptionalString(record.text)
        if (!text) {
          return null
        }
        return {
          type: "text",
          text,
        }
      }

      if (type !== "binary") {
        return null
      }

      const mimeType = toOptionalString(record.mimeType)
      if (!mimeType) {
        return null
      }

      return {
        type: "binary",
        mimeType,
        id: toOptionalString(record.id),
        url: toOptionalString(record.url),
        data: toOptionalString(record.data),
        filename: toOptionalString(record.filename),
      }
    })
    .filter((part): part is SerializableUserContentPart => part !== null)

  return parts.length > 0 ? parts : toMessageText(content)
}

function toSerializableMessage(message: ChatMessage, index: number) {
  const role = toHandoffMessageRole(message.role)
  if (!role || role === "activity") {
    return null
  }

  const id = toOptionalString(message.id) ?? `handoff-${index}-${crypto.randomUUID()}`
  const name = toOptionalString(message.name)

  if (role === "user") {
    return {
      id,
      role: "user" as const,
      content: toSerializableUserContent(message.content),
      ...(name ? { name } : {}),
    }
  }

  if (role === "assistant") {
    const content = toMessageText(message.content)
    const toolCalls = toSerializableToolCalls(message.toolCalls)
    if (!content && !toolCalls) {
      return null
    }

    return {
      id,
      role: "assistant" as const,
      ...(name ? { name } : {}),
      ...(content ? { content } : {}),
      ...(toolCalls ? { toolCalls } : {}),
    }
  }

  if (role === "tool") {
    const content = toMessageText(message.content)
    const toolCallId = toOptionalString(message.toolCallId)
    if (!content || !toolCallId) {
      return null
    }

    const error = toOptionalString(message.error)
    return {
      id,
      role: "tool" as const,
      content,
      toolCallId,
      ...(error ? { error } : {}),
    }
  }

  const content = toMessageText(message.content)
  if (!content) {
    return null
  }

  return {
    id,
    role,
    content,
    ...(name ? { name } : {}),
  }
}

function toSerializableMessages(messages: ChatMessage[]) {
  return messages
    .map((message, index) => toSerializableMessage(message, index))
    .filter((message): message is NonNullable<ReturnType<typeof toSerializableMessage>> => Boolean(message))
}

function formatHandoffMetadata(metadata: HandoffMetadata) {
  return [
    "[HANDOFF_METADATA_V1]",
    JSON.stringify(metadata, null, 2),
    "[/HANDOFF_METADATA_V1]",
    "Use this metadata as the primary context for continuation.",
  ].join("\n")
}

function nextAnimationFrame() {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

export function useAgentHandoffTools() {
  const { stopGeneration, isLoading } = useCopilotChat()
  const { messages, setMessages, sendMessage } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopUIStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopUIStore((state) => state.copilotThreadId)
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)

  const sourceAgentId = useMemo(
    () => (copilotAgentMode === "logo" ? LOGO_COPILOT_AGENT : DESKTOP_COPILOT_AGENT),
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

      let handoffMetadata: HandoffMetadata
      let droppedMessageCount = (messages as ChatMessage[]).length
      let truncateBeforeMessageId: string | null = null
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

        const response = await copilotApi.prepareHandoff(body)
        handoffMetadata = response.metadata
        droppedMessageCount = response.droppedMessageCount
        truncateBeforeMessageId = response.truncateBeforeMessageId
      } catch (error) {
        return {
          ok: false,
          error: toErrorMessage(error),
        }
      }

      // Abort current generation and trim message list before switching agent.
      if (isLoading) {
        stopGeneration()
      }

      const prunedMessages = pruneMessagesBeforeId(
        messages as ChatMessage[],
        truncateBeforeMessageId
      )
      setMessages(toSerializableMessages(prunedMessages) as typeof messages)

      setCopilotAgentMode(targetMode)
      await nextAnimationFrame()

      // Handoff metadata is internal routing context, so we keep it as developer role.
      await sendMessage(
        {
          id: crypto.randomUUID(),
          role: "developer",
          content: formatHandoffMetadata(handoffMetadata),
        },
        { followUp: true }
      )

      return {
        ok: true,
        handoffId: handoffMetadata.handoffId,
        sourceAgentId,
        targetAgentId,
        threadId: copilotThreadId,
        droppedMessageCount,
        metadata: handoffMetadata,
      }
    },
    [
      copilotThreadId,
      isLoading,
      messages,
      sendMessage,
      setMessages,
      setCopilotAgentMode,
      sourceAgentId,
      stopGeneration,
    ]
  )

  useFrontendTool(
    {
      name: "handoff_to_agent",
      description:
        "Switch to another agent without changing thread id. Backend digest is injected as developer metadata before continuation.",
      parameters: HANDOFF_TO_AGENT_PARAMS,
      handler: async (args) => {
        return handoffToAgent({
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
      },
    },
    [handoffToAgent]
  )
}
