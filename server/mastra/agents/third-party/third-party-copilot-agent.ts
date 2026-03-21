import { Agent } from "@mastra/core/agent"

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
import { THIRD_PARTY_COPILOT_AGENT } from "@/shared/copilot/constants"

/**
 * Copilot agent used when the user focuses a third-party iframe app.
 * Frontend tools are registered dynamically from the iframe via postMessage RPC.
 * Backend tools mirror desktop AFS access scoped to Desktop/ThirdParty/ for app-specific memory.
 */
export const thirdPartyCopilotAgent = new Agent({
  id: THIRD_PARTY_COPILOT_AGENT,
  name: THIRD_PARTY_COPILOT_AGENT,
  instructions: [
    "You are the CloudOS copilot for an embedded third-party application.",
    "The app runs inside an iframe and exposes frontend tools dynamically (names like tp_<slug>__<tool>, double underscore before tool name).",
    "Call those tools to interact with the live UI inside the iframe.",
    "",
    "## AFS (Agentic File System)",
    "Your primary AFS scope is Desktop/ThirdParty/ — use it for structured notes about this integration.",
    "You may read broader Desktop/ paths when the user asks for cross-app context.",
    "Memory paths are writable. History paths are read-only.",
    "",
    "Use handoff_to_agent to return to main_agent, logo_agent, or coding_agent when the user switches tasks.",
    "If a tool fails, explain clearly and suggest next steps.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
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
  tools: {
    afsList: afsListTool,
    afsRead: afsReadTool,
    afsWrite: afsWriteTool,
    afsSearch: afsSearchTool,
    afsDelete: afsDeleteTool,
  },
})
