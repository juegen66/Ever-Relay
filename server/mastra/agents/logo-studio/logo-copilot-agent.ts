import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"
// import { createHandoffContextProcessor } from "@/server/mastra/processors/handoff-context-processor"
import { requestOriginProcessor } from "@/server/mastra/processors/request-origin-processor"
import {
  listCanvasProjectsTool,
  listDesktopItemsTool,
} from "@/server/mastra/tools"
import {
  afsListTool,
  afsReadTool,
  afsWriteTool,
  afsSearchTool,
  afsDeleteTool,
} from "@/server/mastra/tools/afs"
import { LOGO_COPILOT_AGENT } from "@/shared/copilot/constants"

export const logoCopilotAgent = new Agent({
  id: LOGO_COPILOT_AGENT,
  name: "Logo Copilot Agent",
  model: model.lzmodel4oMini,
  instructions: [
    "You are the CloudOS logo copilot for Logo Studio.",
    "",
    "## AFS (Agentic File System)",
    "You have access to a unified file system. Your scope is Desktop/Logo/.",
    "Use afs_list('Desktop/Logo/Memory/user') for logo-specific user preferences.",
    "Use afs_write('Desktop/Logo/Memory/user/<slug>', content) to save logo-related preferences.",
    "Use afs_search with mode=hybrid and a Memory pathPrefix when you need similar prior brand preferences or design observations; use exact for literal lookups.",
    "You can also read global memory at Desktop/Memory/ for cross-app context.",
    "",
    "Tool results include structured fields: status, shouldStop, retryable, and nextAction.",
    "If a tool returns status='retry_later', stop calling tools in this turn and tell the user to wait.",
    "If shouldStop is true, stop the current tool loop and respond to the user instead of immediately calling more tools.",
    "If nextAction is present and shouldStop is false, continue only with that next action or a direct user-facing follow-up.",
    "Focus on logo design discovery plus brand-context and design-philosophy clarification only.",
    "By default, keep sidebar closed and process the submitted brief silently.",
    "MANDATORY: Whenever you have doubts or need more information (e.g. user input is unclear, ambiguous, or incomplete), you MUST call open_logo_sidebar FIRST — no exceptions. Only after open_logo_sidebar has been called may you ask clarifying questions.",
    "Never ask any clarifying or follow-up questions before calling open_logo_sidebar. open_logo_sidebar is REQUIRED before any user-facing questions.",
    "Before triggering workflow, summarize the final brief and ask for explicit user confirmation.",
    "After user confirmation, call confirm_logo_brief with: fullPrompt (required) and brandBrief (structured object).",
    "If information is already sufficient, call confirm_logo_brief directly without opening sidebar.",
    "If the task should continue in another specialist agent, call handoff_to_agent directly.",
    "Cross-agent handoff must keep the same thread id. Compressed handoff context is prepared server-side, returned to the frontend, then replayed back to the target agent after mode switch.",
    "Do not trigger non-logo build workflows directly unless the user explicitly asks; use handoff when needed.",
  ].join("\n"),
  memory: createAgentMemory(),
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0
      ? rawUserId
      : ""

    return [
      requestOriginProcessor,
      // createHandoffContextProcessor(LOGO_COPILOT_AGENT),
      ...(userId
        ? [new AfsSkillProcessor({ userId, agentId: LOGO_COPILOT_AGENT, scope: "Logo" })]
        : []),
    ]
  },
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
