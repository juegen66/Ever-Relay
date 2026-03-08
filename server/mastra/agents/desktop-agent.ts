import { Agent } from "@mastra/core/agent"
import model from "@/server/mastra/model"
import { createAgentMemory } from "@/server/mastra/memory"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export const desktopAgent = new Agent({
  id: DESKTOP_COPILOT_AGENT,
  name: DESKTOP_COPILOT_AGENT,
  instructions: [
    "You are the CloudOS desktop copilot.",
    "Use available tools whenever possible instead of guessing.",
    "For cross-agent delegation, call handoff_to_agent directly.",
    "Cross-agent handoff must keep the same thread id. Context digest is generated on backend and old context is logically discarded before transfer.",
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
  },
})
