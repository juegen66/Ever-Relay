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
import { requestOriginProcessor } from "@/server/mastra/processors/request-origin-processor"
import {
  listCanvasProjectsTool,
  listDesktopItemsTool,
} from "@/server/mastra/tools"
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
    "You can also read global memory at Desktop/Memory/ for cross-app context.",
    "",
    "Focus on logo design discovery plus brand-context and design-philosophy clarification only.",
    "By default, keep sidebar closed and process the submitted brief silently.",
    "MANDATORY: Whenever you have doubts or need more information (e.g. user input is unclear, ambiguous, or incomplete), you MUST call open_logo_sidebar FIRST — no exceptions. Only after open_logo_sidebar has been called may you ask clarifying questions.",
    "Never ask any clarifying or follow-up questions before calling open_logo_sidebar. open_logo_sidebar is REQUIRED before any user-facing questions.",
    "Before triggering workflow, summarize the final brief and ask for explicit user confirmation.",
    "After user confirmation, call confirm_logo_brief with: fullPrompt (required) and brandBrief (structured object).",
    "If information is already sufficient, call confirm_logo_brief directly without opening sidebar.",
    "If the task should continue in another specialist agent, call handoff_to_agent directly.",
    "Cross-agent handoff must keep the same thread id. Context digest is generated on backend and old context is logically discarded before transfer.",
    "Do not trigger non-logo build workflows directly unless the user explicitly asks; use handoff when needed.",
  ].join("\n"),
  memory: createAgentMemory(),
  inputProcessors: [requestOriginProcessor],
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
