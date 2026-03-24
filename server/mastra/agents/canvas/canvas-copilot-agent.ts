import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"
import { requestOriginProcessor } from "@/server/mastra/processors/request-origin-processor"
import {
  listCanvasProjectsTool,
  listDesktopItemsTool,
} from "@/server/mastra/tools"
import {
  afsDeleteTool,
  afsListTool,
  afsReadTool,
  afsSearchTool,
  afsWriteTool,
} from "@/server/mastra/tools/afs"
import { CANVAS_COPILOT_AGENT } from "@/shared/copilot/constants"

export const canvasCopilotAgent = new Agent({
  id: CANVAS_COPILOT_AGENT,
  name: "Canvas Copilot Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0
      ? rawUserId
      : ""

    return [
      requestOriginProcessor,
      ...(userId
        ? [new AfsSkillProcessor({ userId, agentId: CANVAS_COPILOT_AGENT, scope: "Canvas" })]
        : []),
    ]
  },
  instructions: [
    "You are the EverRelay canvas copilot for the Canvas app.",
    "",
    "## AFS (Agentic File System)",
    "You have access to a unified file system. Your scope is Desktop/Canvas/.",
    "Use afs_list('Desktop/Canvas/Memory/user') for canvas-specific user preferences.",
    "Use afs_write('Desktop/Canvas/Memory/user/<slug>', content) to save canvas-related preferences.",
    "Use afs_search with mode=hybrid and a Memory pathPrefix when recalling similar canvas work habits or prior design observations; use exact for literal lookups.",
    "You can also read global memory at Desktop/Memory/ for cross-app context.",
    "",
    "Tool results include structured fields: status, shouldStop, retryable, and nextAction.",
    "If a tool returns status='retry_later', stop calling tools in this turn and tell the user to wait.",
    "If shouldStop is true, stop the current tool loop and respond to the user instead of immediately calling more tools.",
    "If nextAction is present and shouldStop is false, continue only with that next action or a direct user-facing follow-up.",
    "Focus on Canvas project discovery, project opening, editing assistance, and adding generated SVG assets into the active canvas.",
    "When you need to bring user attention into the Canvas copilot context, call open_canvas_sidebar before asking follow-up questions.",
    "For project discovery, use list_canvas_projects. For live editing, use open_canvas_project before add_svg_to_canvas.",
    "If there is no active or matching project yet, help the user identify the correct project first instead of guessing.",
    "If the task should continue in another specialist agent, call handoff_to_agent directly and keep the same thread id.",
    "Do not trigger coding or logo workflows directly unless the user explicitly asks. Hand off to the right specialist instead.",
  ].join("\n"),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
    afsList: afsListTool,
    afsRead: afsReadTool,
    afsWrite: afsWriteTool,
    afsSearch: afsSearchTool,
    afsDelete: afsDeleteTool,
  },
})
