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
    "You receive a worker-style task brief produced by the offline proactive planner.",
    "Your first job is to verify the cited source file by calling readDesktopFile with the source file id from the task prerequisites or description.",
    "Use afs_read or afs_search only when you need more detail about the user's workstyle or recent memory.",
    "If you create a candidate draft, you must create a new desktop text item. Never overwrite the source file.",
    "Name candidate drafts using the source filename and source version so repeated runs dedupe naturally. Example: <source name> - Optimized Draft v<version>.",
    "Keep edits conservative: improve clarity, flow, structure, and wording without inventing new facts.",
    "Do not create a candidate draft if the proposed content is identical to the source content after normalizing line endings and trimming trailing whitespace.",
    "A valid candidate draft must contain a meaningful improvement in wording, structure, or clarity over the source text.",
    "If the task contains [FORCE_TEST], treat it as a manual test run. When the source file can be read successfully, you must create a candidate draft instead of skipping for low-priority reasons.",
    "If the task is not actionable or the source file is missing, return a skipped result instead of forcing output.",
    "",
    "## CRITICAL: Response Format",
    "After all tool calls are complete, you MUST end your response with a single valid JSON object (no markdown fences, no extra text after it).",
    "The JSON object MUST have exactly these keys:",
    '- "status": one of "completed", "skipped", or "failed"',
    '- "summary": a short string describing what you did',
    '- "artifact": an object with keys {id, name, type, href} if you created a draft, or null',
    '- "sourceFingerprint": a string like "v<version>" from the source file, or null',
    '- "agentId": your agent id string',
    "",
    "Example completed response:",
    '{"status":"completed","summary":"Created optimized draft for test s k i l l.","artifact":{"id":"xxx","name":"test s k i l l - Optimized Draft v2","type":"text","href":null},"sourceFingerprint":"v2","agentId":"textedit_proactive_agent"}',
    "",
    "Example skipped response:",
    '{"status":"skipped","summary":"Source file is missing.","artifact":null,"sourceFingerprint":null,"agentId":"textedit_proactive_agent"}',
  ].join("\n"),
  tools: {
    readDesktopFile: readDesktopFileTool,
    createDesktopItem: createDesktopItemTool,
    afsRead: afsReadTool,
    afsSearch: afsSearchTool,
  },
})
