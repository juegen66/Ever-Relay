import { describe, expect, it } from "vitest"

import {
  shouldCarryOverAgentMessages,
  toStructuredCloneableMessages,
} from "../agent-message-carryover"

import type { Message } from "@copilotkit/shared"

function createMessage(id: string, role: Message["role"], content: string): Message {
  return {
    id,
    role,
    content,
  }
}

describe("agent-message-carryover", () => {
  it("carries over messages when the agent changes inside the same thread", () => {
    expect(
      shouldCarryOverAgentMessages(
        {
          agentId: "main_agent",
          threadId: "thread-1",
          messages: [createMessage("user-1", "user", "hello")],
        },
        {
          agentId: "logo_agent",
          threadId: "thread-1",
          messages: [],
        }
      )
    ).toBe(true)
  })

  it("does not carry over messages when the thread changes", () => {
    expect(
      shouldCarryOverAgentMessages(
        {
          agentId: "main_agent",
          threadId: "thread-1",
          messages: [createMessage("user-1", "user", "hello")],
        },
        {
          agentId: "logo_agent",
          threadId: "thread-2",
          messages: [],
        }
      )
    ).toBe(false)
  })

  it("does not overwrite messages that already exist on the target agent", () => {
    expect(
      shouldCarryOverAgentMessages(
        {
          agentId: "main_agent",
          threadId: "thread-1",
          messages: [createMessage("user-1", "user", "hello")],
        },
        {
          agentId: "logo_agent",
          threadId: "thread-1",
          messages: [createMessage("assistant-1", "assistant", "hi")],
        }
      )
    ).toBe(false)
  })

  it("carries over messages during an active handoff even when target agent has stale messages", () => {
    expect(
      shouldCarryOverAgentMessages(
        {
          agentId: "logo_agent",
          threadId: "thread-1",
          messages: [
            createMessage("user-1", "user", "hello"),
            createMessage("assistant-1", "assistant", "hi from logo"),
          ],
        },
        {
          agentId: "main_agent",
          threadId: "thread-1",
          messages: [createMessage("user-0", "user", "switch to logo")],
        },
        { isHandoffInProgress: true }
      )
    ).toBe(true)
  })

  it("does not carry over during handoff when previous agent has no messages", () => {
    expect(
      shouldCarryOverAgentMessages(
        {
          agentId: "logo_agent",
          threadId: "thread-1",
          messages: [],
        },
        {
          agentId: "main_agent",
          threadId: "thread-1",
          messages: [createMessage("user-0", "user", "switch to logo")],
        },
        { isHandoffInProgress: true }
      )
    ).toBe(false)
  })

  it("strips non-cloneable fields before messages are rehydrated into the next agent", () => {
    const messages = toStructuredCloneableMessages([
      {
        ...createMessage("assistant-1", "assistant", "hello"),
        generativeUI: () => "ui",
        meta: {
          nestedFn: () => "nested",
          safe: "value",
        },
      } as Message,
    ])

    expect(messages).toEqual([
      {
        id: "assistant-1",
        role: "assistant",
        content: "hello",
        meta: {
          safe: "value",
        },
      },
    ])
  })
})
