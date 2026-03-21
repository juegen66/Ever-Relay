import type { Context } from "hono"

import type { PrepareHandoffBody } from "@/shared/contracts/copilot-handoff"
import { db } from "@/server/core/database"
import { handoffContext, handoffRecords } from "@/server/db/schema"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { buildHandoffMetadata, formatHandoffDocument } from "./copilot-handoff.service"
import { toSafeText } from "./copilot-handoff.utils"

export async function prepareHandoff(
  context: Context<ServerBindings>,
  body: PrepareHandoffBody
) {
  const userId = requireUserId(context)

  const metadata = await buildHandoffMetadata(body)
  if (!metadata) {
    return fail(
      context,
      400,
      "sourceAgentId and threadId are required for handoff preparation"
    )
  }

  try {
    await db.insert(handoffRecords).values({
      userId,
      handoffId: metadata.handoffId,
      sourceAgentId: metadata.sourceAgentId,
      targetAgentId: metadata.targetAgentId,
      threadId: metadata.threadId,
      reason: metadata.reason,
      report: metadata.report,
    })

    await db.insert(handoffContext).values({
      userId,
      threadId: metadata.threadId,
      sourceAgentId: metadata.sourceAgentId,
      targetAgentId: metadata.targetAgentId,
      content: formatHandoffDocument(metadata.report),
      status: "pending",
      metadata: {
        handoffId: metadata.handoffId,
        reason: metadata.reason,
        task: metadata.report.task,
        done: metadata.report.done,
        nextSteps: metadata.report.nextSteps,
        constraints: metadata.report.constraints,
        artifacts: metadata.report.artifacts,
        openQuestions: metadata.report.openQuestions,
        riskNotes: metadata.report.riskNotes,
      },
    })
  } catch (error) {
    console.error("[prepareHandoff] Failed to persist handoff record:", error)
    return fail(context, 500, "Failed to record handoff")
  }

  const truncateBeforeMessageId = toSafeText(body.lastMessageId) || null

  return ok(context, {
    metadata,
    droppedMessageCount: body.messages.length,
    truncateBeforeMessageId,
  })
}
