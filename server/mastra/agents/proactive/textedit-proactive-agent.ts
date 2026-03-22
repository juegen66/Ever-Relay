import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import model from "@/server/mastra/model"
import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"
import {
  createDesktopItemTool,
  readDesktopFileTool,
} from "@/server/mastra/tools"
import {
  afsReadTool,
  afsSearchTool,
} from "@/server/mastra/tools/afs"
import { createDynamicSkillWorkspace } from "@/server/mastra/workspace"

const textEditProactiveRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
})

export const texteditProactiveAgent = new Agent({
  id: TEXTEDIT_PROACTIVE_AGENT_ID,
  name: "TextEdit Proactive Agent",
  model: model.lzmodel4oMini,
  requestContextSchema: textEditProactiveRequestContextSchema,
  workspace: ({ requestContext }) => {
    const userId = String(requestContext.get("userId") ?? "")
    return createDynamicSkillWorkspace(
      userId,
      TEXTEDIT_PROACTIVE_AGENT_ID,
      undefined,
      "Desktop"
    )
  },
  instructions: [
    "You execute offline proactive tasks for TextEdit documents.",
    "You receive a task and a compressed background from the discovery agent.",
    "Your first job is to verify the cited source file by calling readDesktopFile with the source file id from the background.",
    "Use afs_read or afs_search only when you need more detail about the user's workstyle or recent memory.",
    "If you create a candidate draft, you must create a new desktop text item. Never overwrite the source file.",
    "Name candidate drafts using the source filename and source version so repeated runs dedupe naturally. Example: <source name> - Optimized Draft v<version>.",
    "Keep edits conservative: improve clarity, flow, structure, and wording without inventing new facts.",
    "If the task is not actionable or the source file is missing, return a skipped result instead of forcing output.",
  ].join("\n"),
  tools: {
    readDesktopFile: readDesktopFileTool,
    createDesktopItem: createDesktopItemTool,
    afsRead: afsReadTool,
    afsSearch: afsSearchTool,
  },
})
