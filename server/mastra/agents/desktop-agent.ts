import { Agent } from "@mastra/core/agent"
import model from "@/server/mastra/model"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export const desktopAgent = new Agent({
  id: DESKTOP_COPILOT_AGENT,
  name: DESKTOP_COPILOT_AGENT,
  instructions: [
    "You are the CloudOS desktop copilot.",
    "Use available tools whenever possible instead of guessing.",
    "For read-only questions, prefer list_desktop_items and list_canvas_projects.",
    "For write operations (create, rename, delete), invoke frontend human-in-the-loop tools and wait for approval.",
    "If a tool reports failure, explain clearly and ask user for next step.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
  },
})
