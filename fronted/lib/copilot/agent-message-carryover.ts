"use client"

import type { Message } from "@copilotkit/shared"

export interface AgentMessageSnapshot {
  agentId: string | null
  threadId: string | null
  messages: Message[]
}

function toStructuredCloneableValue(value: unknown): unknown {
  if (value == null) {
    return value
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return undefined
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toStructuredCloneableValue(item))
      .filter((item) => item !== undefined)
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const cloneableItem = toStructuredCloneableValue(item)
        return cloneableItem === undefined ? [] : [[key, cloneableItem]]
      })
    )
  }

  return value
}

export function toStructuredCloneableMessages(messages: Message[]): Message[] {
  return messages.map((message) => toStructuredCloneableValue(message) as Message)
}

export function shouldCarryOverAgentMessages(
  previous: AgentMessageSnapshot,
  next: AgentMessageSnapshot,
  options?: { isHandoffInProgress?: boolean }
) {
  if (!previous.threadId || !next.threadId) {
    return false
  }

  if (previous.threadId !== next.threadId) {
    return false
  }

  if (!previous.agentId || !next.agentId || previous.agentId === next.agentId) {
    return false
  }

  if (previous.messages.length === 0) {
    return false
  }

  // During an active handoff, always carry over — the target agent may already
  // hold stale messages from a previous session (e.g. logo → main round-trip).
  if (options?.isHandoffInProgress) {
    return true
  }

  if (next.messages.length > 0) {
    return false
  }

  return true
}
