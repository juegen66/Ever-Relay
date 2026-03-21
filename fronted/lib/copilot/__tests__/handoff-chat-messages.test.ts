import { describe, expect, it } from "vitest"

import {
  toApiMessages,
  toSerializableMessages,
  type ChatMessage,
} from "../handoff-chat-messages"

describe("handoff-chat-messages", () => {
  it("deduplicates repeated message ids before serializing handoff history", () => {
    const messages: ChatMessage[] = [
      {
        id: "user-1",
        role: "user",
        content: "切换到logo agent mode",
      },
      {
        id: "assistant-1",
        role: "assistant",
        toolCalls: [
          {
            id: "tool-1",
            type: "function",
            function: {
              name: "handoff_to_agent",
              arguments: "{\"targetAgentId\":\"logo_agent\"}",
            },
          },
        ],
      },
      {
        id: "assistant-1",
        role: "assistant",
        toolCalls: [
          {
            id: "tool-1",
            type: "function",
            function: {
              name: "handoff_to_agent",
              arguments: "{\"targetAgentId\":\"logo_agent\"}",
            },
          },
        ],
      },
    ]

    expect(toSerializableMessages(messages)).toEqual([
      {
        id: "user-1",
        role: "user",
        content: "切换到logo agent mode",
      },
      {
        id: "assistant-1",
        role: "assistant",
        toolCalls: [
          {
            id: "tool-1",
            type: "function",
            function: {
              name: "handoff_to_agent",
              arguments: "{\"targetAgentId\":\"logo_agent\"}",
            },
          },
        ],
      },
    ])
  })

  it("deduplicates repeated ids before building the backend handoff digest", () => {
    const messages: ChatMessage[] = [
      {
        id: "user-1",
        role: "user",
        content: "切换到logo agent mode",
      },
      {
        id: "user-1",
        role: "user",
        content: "切换到logo agent mode",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "正在为你切换到 logo agent。",
      },
    ]

    expect(toApiMessages(messages)).toEqual([
      {
        role: "user",
        content: "切换到logo agent mode",
      },
      {
        role: "assistant",
        content: "正在为你切换到 logo agent。",
      },
    ])
  })
})
