import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import {
  afsListTool,
  afsReadTool,
  afsWriteTool,
  afsSearchTool,
  afsDeleteTool,
} from "@/server/mastra/tools/afs"
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
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
    "Memory paths are writable. History paths are read-only.",
    "",
    "For cross-agent delegation, call handoff_to_agent directly.",
    "Cross-agent handoff must keep the same thread id. Context digest is generated on backend and old context is logically discarded before transfer.",
    "For codebase implementation, coding workflow, or repo-inspection tasks, first check the active coding app context.",
    "If there is no active coding app, first guide the user to the vibecoding app so they can create or activate one there. If the user explicitly asks you to do it directly, you may use create_coding_app or activate_coding_app.",
    "Only once a coding app is active should you hand off to coding_agent, because coding work must stay inside that app's thread and sandbox.",
    "Do not call start_new_chat_thread unless the user explicitly asks for a brand-new chat context.",
    "For read-only questions, prefer list_desktop_items and list_canvas_projects.",
    "For desktop write operations, create can run directly via frontend tool, while rename/delete must use frontend human-in-the-loop tools and wait for approval.",
    "If a tool reports failure, explain clearly and ask user for next step.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
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
