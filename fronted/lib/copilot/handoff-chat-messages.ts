import type { CopilotHandoffMessage } from "@/shared/contracts/copilot-handoff"

export type ChatMessage = {
  id?: string
  role?: string
  name?: unknown
  content?: unknown
  toolCalls?: unknown
  toolCallId?: unknown
  error?: unknown
}

export type SerializableToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export type SerializableUserContentPart =
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

export type SerializableMessage =
  | {
      id: string
      role: "user"
      content: string | SerializableUserContentPart[]
      name?: string
    }
  | {
      id: string
      role: "assistant"
      name?: string
      content?: string
      toolCalls?: SerializableToolCall[]
    }
  | {
      id: string
      role: "tool"
      content: string
      toolCallId: string
      error?: string
    }
  | {
      id: string
      role: "developer" | "system"
      content: string
      name?: string
    }

function toSafeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function toOptionalString(value: unknown) {
  const text = toSafeText(value)
  return text || undefined
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

function toSerializableUserContent(
  content: unknown
): string | SerializableUserContentPart[] {
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

function dedupeMessagesById(messages: ChatMessage[]) {
  const lastIndexById = new Map<string, number>()

  messages.forEach((message, index) => {
    const id = toOptionalString(message.id)
    if (id) {
      lastIndexById.set(id, index)
    }
  })

  return messages.filter((message, index) => {
    const id = toOptionalString(message.id)
    if (!id) {
      return true
    }

    return lastIndexById.get(id) === index
  })
}

export function toApiMessages(messages: ChatMessage[]): CopilotHandoffMessage[] {
  return dedupeMessagesById(messages)
    .map((message) => {
      const role = toHandoffMessageRole(message.role)
      const content = toMessageText(message.content)
      if (!role || !content) {
        return null
      }

      return { role, content }
    })
    .filter((message): message is CopilotHandoffMessage => message !== null)
    .slice(-60)
}

export function findLastMessageId(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = toSafeText(messages[index]?.id)
    if (candidate) {
      return candidate
    }
  }
  return undefined
}

export function pruneMessagesBeforeId(messages: ChatMessage[], messageId: string | null) {
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

export function toSerializableMessages(messages: ChatMessage[]) {
  return dedupeMessagesById(messages)
    .map((message, index) => toSerializableMessage(message, index))
    .filter((message): message is SerializableMessage => message !== null)
}
