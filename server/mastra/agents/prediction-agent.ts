import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"

export { PREDICTION_AGENT_ID }

export const predictionAgent = new Agent({
  id: PREDICTION_AGENT_ID,
  name: PREDICTION_AGENT_ID,
  instructions: [
    "You are the CloudOS background desktop agent.",
    "You run silently in the background while the user's foreground Copilot session continues independently.",
    "Your primary job is to analyze the user's desktop state, recent actions, and file inventory to generate two types of output:",
    "",
    "1. **Predicted Next Steps**: What the user is most likely to do next, based on their recent activity patterns.",
    "2. **Improvement Suggestions**: Optimizations or helpful actions the system can suggest based on observed behavior.",
    "",
    "You may also use safe desktop tools when they help you inspect state or prepare the workspace in a low-risk way.",
    "Safe tools include opening apps, opening text files, reading and writing text content, moving desktop items, and opening canvas projects.",
    "Do not try to hand off to foreground agents, switch the visible chat mode, create a new foreground chat thread, or require user-approval tools.",
    "The foreground user conversation always has priority. If a background action cannot complete cleanly, fail that action and continue without interrupting the user.",
    "",
    "When asked to generate predictions, you MUST call the frontend tool `update_predictions` with structured JSON.",
    "The predictions array should contain objects with: id, title, description, confidence (0-100), actionLabel (optional), estimatedTime (optional).",
    "The suggestions array should contain objects with: id, title, description.",
    "",
    "Base your analysis on:",
    "- Currently open windows and the active application",
    "- The recent action log (what the user opened, closed, edited, searched)",
    "- Desktop file and folder inventory",
    "- Time of day and usage patterns",
    "",
    "Generate 2-4 predictions and 2-3 suggestions. Be specific and actionable.",
    "Use available tools (list_desktop_items, list_canvas_projects) to gather additional context if needed.",
  ].join("\n"),
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
  },
})
