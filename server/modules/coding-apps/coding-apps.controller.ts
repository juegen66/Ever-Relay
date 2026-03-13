import type { Context } from "hono"

import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import type {
  CodingAppIdParams,
  CreateCodingAppParams,
} from "@/shared/contracts/coding-apps"

import { codingAppsService } from "./coding-apps.service"

function formatCodingApp(
  app: NonNullable<Awaited<ReturnType<typeof codingAppsService.getAppByIdForUser>>>
) {
  return {
    id: app.id,
    userId: app.userId,
    name: app.name,
    description: app.description ?? null,
    sandboxId: app.sandboxId,
    threadId: app.threadId,
    status: app.status,
    lastOpenedAt: app.lastOpenedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }
}

export async function createCodingApp(
  context: Context<ServerBindings>,
  body: CreateCodingAppParams
) {
  const userId = requireUserId(context)
  const app = await codingAppsService.createApp({
    userId,
    name: body.name,
    description: body.description,
  })

  return ok(context, formatCodingApp(app))
}

export async function listCodingApps(context: Context<ServerBindings>) {
  const userId = requireUserId(context)
  const apps = await codingAppsService.listAppsByUser(userId)
  return ok(context, apps.map((app) => formatCodingApp(app)))
}

export async function getCodingApp(
  context: Context<ServerBindings>,
  params: CodingAppIdParams
) {
  const userId = requireUserId(context)
  const app = await codingAppsService.getAppByIdForUser(params.id, userId)

  if (!app) {
    return fail(context, 404, "Coding app not found")
  }

  return ok(context, formatCodingApp(app))
}

export async function activateCodingApp(
  context: Context<ServerBindings>,
  params: CodingAppIdParams
) {
  const userId = requireUserId(context)
  const app = await codingAppsService.markOpened(params.id, userId)

  if (!app) {
    return fail(context, 404, "Coding app not found")
  }

  return ok(context, formatCodingApp(app))
}
