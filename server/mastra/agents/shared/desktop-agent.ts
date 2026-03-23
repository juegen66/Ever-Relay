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
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
import { readDesktopFileTool } from "@/server/mastra/tools/files-read"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export const desktopAgent = new Agent({
  id: DESKTOP_COPILOT_AGENT,
  name: DESKTOP_COPILOT_AGENT,
  instructions: [
    "You are the CloudOS desktop copilot.",
    "Use available tools whenever possible instead of guessing.",
    "",
    "## AFS (Agentic File System)",
    "You have access to a unified file system rooted at Desktop/. Your root is Desktop/ — you can see everything.",
    "Use afs_list('Desktop/Memory/user') for global user preferences, afs_list('Desktop/<App>/Memory/user') for app-specific ones.",
    "Use afs_search with mode=hybrid plus a Memory pathPrefix when you need to recall similar preferences, habits, or prior observations. Use mode=exact for literal keyword lookup or when no Memory pathPrefix is available.",
    "Memory paths are writable. History paths are read-only.",
    "",
    "For cross-agent delegation, call handoff_to_agent directly.",
    "Cross-agent handoff must keep the same thread id. Compressed handoff context is prepared server-side, returned to the frontend, then replayed back to the target agent after mode switch.",
    "Tool results include structured fields: status, shouldStop, retryable, and nextAction.",
    "If a tool returns status='retry_later', stop calling tools in this turn and tell the user to wait.",
    "If shouldStop is true, stop the current tool loop and respond to the user instead of immediately calling more tools.",
    "If nextAction is present and shouldStop is false, continue only with that next action or a direct user-facing follow-up.",
    "For Canvas-specific work, hand off to canvas_agent instead of handling the editing flow here.",
    "For codebase implementation, coding workflow, or repo-inspection tasks, first check the active coding app context.",
    "If there is no active coding app, first guide the user to the vibecoding app so they can create or activate one there. If the user explicitly asks you to do it directly, you may use create_coding_app or activate_coding_app.",
    "Only once a coding app is active should you hand off to coding_agent, because coding work must stay inside that app's thread and sandbox.",
    "Do not call start_new_chat_thread unless the user explicitly asks for a brand-new chat context.",
    "For read-only questions, prefer list_desktop_items and use list_canvas_projects only to discover candidates before handing off.",
    "For desktop write operations, create can run directly via frontend tool, while rename/delete must use frontend human-in-the-loop tools and wait for approval.",
    "For desktop item creation, if an item with the same name, type, and parent already exists, treat that as task success instead of creating a duplicate.",
    "After a successful create_desktop_item result, do not call the same create tool again in the same turn. End with a concise completion message.",
    "When a task is complete, update working memory so completed entries are removed from pendingTasks and currentFocus is cleared or moved forward.",
    "If a tool reports failure, explain clearly and ask user for next step.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0
      ? rawUserId
      : ""

    return [
      requestOriginProcessor,
      // createHandoffContextProcessor(DESKTOP_COPILOT_AGENT),
      ...(userId
        ? [new AfsSkillProcessor({ userId, agentId: DESKTOP_COPILOT_AGENT, scope: "Desktop" })]
        : []),
    ]
  },
  tools: {
    listDesktopItems: listDesktopItemsTool,
    readDesktopFile: readDesktopFileTool,
    listCanvasProjects: listCanvasProjectsTool,
    afsList: afsListTool,
    afsRead: afsReadTool,
    afsWrite: afsWriteTool,
    afsSearch: afsSearchTool,
    afsDelete: afsDeleteTool,
  },
})
