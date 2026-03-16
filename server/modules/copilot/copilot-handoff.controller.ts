import type { Context } from "hono"

import type { PrepareHandoffBody } from "@/shared/contracts/copilot-handoff"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { buildHandoffMetadata } from "./copilot-handoff.service"
import { toSafeText } from "./copilot-handoff.utils"

export async function prepareHandoff(
  context: Context<ServerBindings>,
  body: PrepareHandoffBody
) {
  requireUserId(context)

  const metadata = await buildHandoffMetadata(body)
  if (!metadata) {
    return fail(
      context,
      400,
      "sourceAgentId and threadId are required for handoff preparation"
    )
  }

  const truncateBeforeMessageId = toSafeText(body.lastMessageId) || null

  return ok(context, {
    metadata,
    droppedMessageCount: body.messages.length,
    truncateBeforeMessageId,
  })
}
