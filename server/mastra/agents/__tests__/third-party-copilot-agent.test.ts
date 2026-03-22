import { RequestContext } from "@mastra/core/request-context"
import { createTool } from "@mastra/core/tools"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

const { listToolsForAgent } = vi.hoisted(() => ({
  listToolsForAgent: vi.fn(),
}))

vi.mock("@/server/modules/third-party-mcp/third-party-mcp.service", () => ({
  thirdPartyMcpService: {
    listToolsForAgent,
  },
}))

vi.mock("@/server/core/database", () => ({
  pool: {},
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      afsMemory: { findFirst: vi.fn() },
      afsHistory: { findFirst: vi.fn() },
      afsSkill: { findFirst: vi.fn() },
      thirdPartyMcpBinding: { findFirst: vi.fn() },
    },
  },
}))

import { thirdPartyCopilotAgent } from "@/server/mastra/agents/third-party/third-party-copilot-agent"

const remotePingTool = createTool({
  id: "remote_ping",
  description: "Ping the remote MCP server",
  inputSchema: z.object({}),
  execute: async () => ({ ok: true }),
})

describe("third-party copilot agent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("merges MCP tools when third-party app context is present", async () => {
    listToolsForAgent.mockResolvedValueOnce({
      mcp_demo_weather__ping: remotePingTool,
    })

    const tools = await thirdPartyCopilotAgent.listTools({
      requestContext: new RequestContext([
        ["userId", "user-1"],
        ["thirdPartyAppSlug", "demo_weather"],
      ]),
    })

    expect(listToolsForAgent).toHaveBeenCalledWith("user-1", "demo_weather")
    expect(tools).toHaveProperty("afsRead")
    expect(tools).toHaveProperty("mcp_demo_weather__ping")
  })

  it("skips MCP loading when app context is absent", async () => {
    const tools = await thirdPartyCopilotAgent.listTools({
      requestContext: new RequestContext([["userId", "user-1"]]),
    })

    expect(listToolsForAgent).not.toHaveBeenCalled()
    expect(tools).toHaveProperty("afsRead")
  })
})
