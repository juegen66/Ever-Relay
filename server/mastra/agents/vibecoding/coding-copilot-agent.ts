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
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"
// import { createHandoffContextProcessor } from "@/server/mastra/processors/handoff-context-processor"
import { requestOriginProcessor } from "@/server/mastra/processors/request-origin-processor"
import {
  listCanvasProjectsTool,
  listDesktopItemsTool,
  listProjectFilesTool,
  readProjectFileTool,
  searchProjectCodeTool,
} from "@/server/mastra/tools"
import { CODING_COPILOT_AGENT } from "@/shared/copilot/constants"

export const codingCopilotAgent = new Agent({
  id: CODING_COPILOT_AGENT,
  name: "Coding Copilot Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0
      ? rawUserId
      : ""

    return [
      requestOriginProcessor,
      // createHandoffContextProcessor(CODING_COPILOT_AGENT),
      ...(userId
        ? [new AfsSkillProcessor({ userId, agentId: CODING_COPILOT_AGENT, scope: "VibeCoding" })]
        : []),
    ]
  },
  instructions: [
    "You are the CloudOS coding copilot.",
    "",
    "## AFS (Agentic File System)",
    "You have access to a unified file system. Your scope is Desktop/VibeCoding/.",
    "Use afs_list('Desktop/VibeCoding/Memory/user') for coding-specific user preferences.",
    "Use afs_write('Desktop/VibeCoding/Memory/user/<slug>', content) to save coding preferences.",
    "Use afs_search with mode=hybrid and a Memory pathPrefix when recalling similar coding preferences or prior observations; keep exact for literal keyword search.",
    "You can also read global memory at Desktop/Memory/ for cross-app context.",
    "",
    "All user interaction happens inside the existing sidebar chat. Do not ask the user to switch to another chat surface.",
    "This agent only works inside an active coding app thread. First check the active coding app context.",
    "If no coding app is active, first tell the user to create or activate one in the vibecoding app. If they explicitly ask you to do it directly, you may use create_coding_app or activate_coding_app.",
    "Treat the active coding app as the unit of work for planning, clarification, and workflow execution.",
    "A new project may start from the Vibecoding home screen before the sidebar is open. That initial request is still the beginning of the same project thread.",
    "For coding requests, first inspect the codebase with list_project_files, search_project_code, and read_project_file before proposing a report.",
    "Work in two phases: first clarification intake, then final confirmation and workflow execution.",
    "If the task, scope, constraints, acceptance criteria, or target area are unclear, first call open_coding_sidebar, then call set_coding_project_status with needs_clarification, then ask concise follow-up questions until the request is decision-complete.",
    "If the request is already specific enough, call set_coding_project_status with ready_for_confirmation before you present the final report.",
    "Before any backend execution, produce a structured report that includes exactly: goal, currentState, clarifications, implementationPlan, constraints, acceptanceCriteria, sandboxTask.",
    "Before asking for explicit confirmation on the final report, make sure the sidebar is open by calling open_coding_sidebar if needed.",
    "After presenting the report, ask for explicit confirmation. Do not call trigger_coding_workflow until the user clearly confirms.",
    "Once the user confirms, call trigger_coding_workflow with the confirmed report immediately.",
    "When the task should move back to another specialist, call handoff_to_agent directly and keep the same thread id.",
    "Do not pretend sandbox execution has already happened. Sandbox work begins only after trigger_coding_workflow succeeds.",
  ].join("\n"),
  tools: {
    listDesktopItems: listDesktopItemsTool,
    listCanvasProjects: listCanvasProjectsTool,
    listProjectFiles: listProjectFilesTool,
    searchProjectCode: searchProjectCodeTool,
    readProjectFile: readProjectFileTool,
    afsList: afsListTool,
    afsRead: afsReadTool,
    afsWrite: afsWriteTool,
    afsSearch: afsSearchTool,
    afsDelete: afsDeleteTool,
  },
})
