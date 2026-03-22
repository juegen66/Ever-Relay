import type { Context } from "hono"

import type {
  AfsDeleteBody,
  AfsListQuery,
  AfsReadQuery,
  AfsSearchQuery,
  AfsWriteBody,
  LogActionBatchBody,
  LogActionBody,
} from "@/shared/contracts/afs"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"

import { afsService } from "./afs.service"

export async function afsList(context: Context<ServerBindings>, query: AfsListQuery) {
  const userId = requireUserId(context)
  const nodes = await afsService.list(userId, query.path, query.limit)
  return ok(context, { path: query.path, nodes })
}

export async function afsRead(context: Context<ServerBindings>, query: AfsReadQuery) {
  const userId = requireUserId(context)
  const node = await afsService.read(userId, query.path)
  if (!node) {
    return fail(context, 404, `Node not found: ${query.path}`)
  }
  return ok(context, node)
}

export async function afsWrite(context: Context<ServerBindings>, body: AfsWriteBody) {
  const userId = requireUserId(context)
  const node = await afsService.write(userId, body.path, body.content, {
    tags: body.tags,
    confidence: body.confidence,
    sourceType: body.sourceType,
    metadata: body.metadata,
  })
  return ok(context, node)
}

export async function afsSearch(context: Context<ServerBindings>, query: AfsSearchQuery) {
  const userId = requireUserId(context)
  const results = await afsService.search(userId, query.query, {
    mode: query.mode,
    scope: query.scope,
    pathPrefix: query.pathPrefix,
    limit: query.limit,
  })
  return ok(context, { results })
}

export async function afsDelete(context: Context<ServerBindings>, body: AfsDeleteBody) {
  const userId = requireUserId(context)
  const deleted = await afsService.delete(userId, body.path)
  if (!deleted) {
    return fail(context, 404, `Node not found: ${body.path}`)
  }
  return ok(context, { deleted: true })
}

export async function logAction(context: Context<ServerBindings>, body: LogActionBody) {
  const userId = requireUserId(context)
  await afsService.logAction(userId, body.actionType, body.payload ?? {}, body.sessionId)
  return ok(context, { logged: true })
}

export async function logActionBatch(context: Context<ServerBindings>, body: LogActionBatchBody) {
  const userId = requireUserId(context)
  await afsService.logActionBatch(userId, body.actions, body.sessionId)
  return ok(context, { logged: body.actions.length })
}
