import { and, desc, eq } from "drizzle-orm"
import { MASTRA_THREAD_ID_KEY } from "@mastra/core/request-context"

import type { ProcessInputArgs } from "@mastra/core/processors"

import { db } from "@/server/core/database"
import {
  handoffContext,
  type HandoffContextMetadata,
} from "@/server/db/schema"

function formatHandoffSystemPrompt(
  markdown: string,
  meta: HandoffContextMetadata | null | undefined
): string {
  const id = meta?.handoffId ?? "unknown"
  return [
    `[Handoff ${id}] The following document was produced by the previous specialist agent.`,
    `Treat it as authoritative context for this turn and continue from here.`,
    ``,
    markdown,
  ].join("\n")
}

/**
 * Loads pending handoff markdown from `handoff_context` and prepends it as a system message.
 * Consumes at most one pending row per (userId, threadId, targetAgentId).
 */
export function createHandoffContextProcessor(agentId: string) {
  return {
    id: "handoff-context-processor" as const,
    name: "Handoff Context Processor",

    async processInput({ messages, requestContext }: ProcessInputArgs) {
      const threadId = requestContext?.get(MASTRA_THREAD_ID_KEY) as string | undefined
      const userId = requestContext?.get("userId") as string | undefined

      if (!threadId || !userId) {
        return messages
      }

      const rows = await db
        .select()
        .from(handoffContext)
        .where(
          and(
            eq(handoffContext.userId, userId),
            eq(handoffContext.threadId, threadId),
            eq(handoffContext.targetAgentId, agentId),
            eq(handoffContext.status, "pending")
          )
        )
        .orderBy(desc(handoffContext.createdAt))
        .limit(1)

      const row = rows[0]
      if (!row) {
        return messages
      }

      await db
        .update(handoffContext)
        .set({ status: "consumed", consumedAt: new Date() })
        .where(eq(handoffContext.id, row.id))

      const systemContent = formatHandoffSystemPrompt(row.content, row.metadata ?? undefined)

      const systemMessage = {
        role: "system" as const,
        content: systemContent,
      }

      return [systemMessage, ...messages]
    },
  }
}
