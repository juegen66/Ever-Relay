import { Agent } from "@mastra/core/agent"

import model from "@/server/mastra/model"
import { createAgentMemory } from "@/server/mastra/memory"
import { listDesktopItemsTool } from "@/server/mastra/tools/desktop"
import { listCanvasProjectsTool } from "@/server/mastra/tools/canvas"

export const PREDICTION_AGENT_ID = "prediction_agent"

export const predictionAgent = new Agent({
  id: PREDICTION_AGENT_ID,
  name: PREDICTION_AGENT_ID,
  instructions: [
    "You are the CloudOS prediction engine.",
    "Your job is to analyze the user's desktop state, recent actions, and file inventory to generate two types of output:",
    "",
    "1. **Predicted Next Steps**: What the user is most likely to do next, based on their recent activity patterns.",
    "2. **Improvement Suggestions**: Optimizations or helpful actions the system can suggest based on observed behavior.",
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
