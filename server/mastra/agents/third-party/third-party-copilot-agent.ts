import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"
// import { createHandoffContextProcessor } from "@/server/mastra/processors/handoff-context-processor"
import { requestOriginProcessor } from "@/server/mastra/processors/request-origin-processor"
import {
  afsListTool,
  afsReadTool,
  afsWriteTool,
  afsSearchTool,
  afsDeleteTool,
} from "@/server/mastra/tools/afs"
import { thirdPartyMcpService } from "@/server/modules/third-party-mcp/third-party-mcp.service"
import { THIRD_PARTY_COPILOT_AGENT } from "@/shared/copilot/constants"

const thirdPartyRequestContextSchema = z.object({
  userId: z.string().min(1),
  thirdPartyAppSlug: z.string().min(1).optional(),
})

/**
 * Copilot agent used when the user focuses a third-party iframe app.
 * Frontend tools are registered dynamically from the iframe via postMessage RPC.
 * Backend tools mirror desktop AFS access scoped to Desktop/ThirdParty/ for app-specific memory.
 */
export const thirdPartyCopilotAgent = new Agent({
  id: THIRD_PARTY_COPILOT_AGENT,
  name: THIRD_PARTY_COPILOT_AGENT,
  instructions: [
    "You are the EverRelay copilot for an embedded third-party application.",
    "The app runs inside an iframe and exposes frontend tools dynamically (names like tp_<slug>__<tool>, double underscore before tool name).",
    "Call those tools to interact with the live UI inside the iframe.",
    "When present, backend MCP tools are prefixed as mcp_<slug>__<tool> and come from the current app's configured MCP server.",
    "",
    "## AFS (Agentic File System)",
    "Your primary AFS scope is Desktop/ThirdParty/ — use it for structured notes about this integration.",
    "Use afs_search with mode=hybrid and a Memory pathPrefix when you need related prior notes or preferences, and use exact for literal terms.",
    "You may read broader Desktop/ paths when the user asks for cross-app context.",
    "Memory paths are writable. History paths are read-only.",
    "",
    "Use handoff_to_agent to return to main_agent, canvas_agent, logo_agent, or coding_agent when the user switches tasks.",
    "If a tool fails, explain clearly and suggest next steps.",
    "",
    "## Response behavior",
    "After a tool call succeeds, reply to the user immediately with a brief confirmation. Do NOT call additional tools unless the user explicitly asks for more actions.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: thirdPartyRequestContextSchema,
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0 ? rawUserId : ""

    return [
      requestOriginProcessor,
      // createHandoffContextProcessor(THIRD_PARTY_COPILOT_AGENT),
      ...(userId
        ? [
            new AfsSkillProcessor({
              userId,
              agentId: THIRD_PARTY_COPILOT_AGENT,
              scope: "Desktop",
            }),
          ]
        : []),
    ]
  },
  tools: async ({ requestContext }) => {
    const localTools = {
      afsList: afsListTool,
      afsRead: afsReadTool,
      afsWrite: afsWriteTool,
      afsSearch: afsSearchTool,
      afsDelete: afsDeleteTool,
    }

    const rawUserId = requestContext.get("userId")
    const rawAppSlug = requestContext.get("thirdPartyAppSlug")
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : ""
    const appSlug = typeof rawAppSlug === "string" ? rawAppSlug.trim() : ""

    if (!userId || !appSlug) {
      return localTools
    }

    try {
      const remoteTools = await thirdPartyMcpService.listToolsForAgent(userId, appSlug)
      return {
        ...localTools,
        ...remoteTools,
      }
    } catch (error) {
      console.warn(
        `[third-party-agent] Failed to load MCP tools for user=${userId} app=${appSlug}`,
        error
      )
      return localTools
    }
  },
})
