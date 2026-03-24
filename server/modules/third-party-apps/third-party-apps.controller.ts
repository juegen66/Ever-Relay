import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import type {
  CreateThirdPartyAppBody,
  ThirdPartyAppParams,
  UpdateThirdPartyAppBody,
} from "@/shared/contracts/third-party-apps"

import { thirdPartyAppsService } from "./third-party-apps.service"

import type { Context } from "hono"

function formatThirdPartyApp(
  app: NonNullable<Awaited<ReturnType<typeof thirdPartyAppsService.getAppBySlugForUser>>>
) {
  return {
    id: app.id,
    userId: app.userId,
    appSlug: app.appSlug,
    displayName: app.displayName,
    websiteUrl: app.websiteUrl,
    allowedOrigins: app.allowedOrigins,
    isActive: app.isActive,
    metadata: app.metadata,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }
}

export async function listThirdPartyApps(context: Context<ServerBindings>) {
  const userId = requireUserId(context)
  const apps = await thirdPartyAppsService.listAppsByUser(userId)
  return ok(context, apps.map((app) => formatThirdPartyApp(app)))
}

export async function createThirdPartyApp(
  context: Context<ServerBindings>,
  body: CreateThirdPartyAppBody
) {
  const userId = requireUserId(context)

  try {
    const app = await thirdPartyAppsService.createApp({
      userId,
      appSlug: body.appSlug,
      displayName: body.displayName,
    })

    return ok(context, formatThirdPartyApp(app))
  } catch (error) {
    return fail(
      context,
      400,
      error instanceof Error ? error.message : "Failed to create third-party app"
    )
  }
}

export async function getThirdPartyApp(
  context: Context<ServerBindings>,
  params: ThirdPartyAppParams
) {
  const userId = requireUserId(context)
  const app = await thirdPartyAppsService.getAppBySlugForUser(userId, params.appSlug)

  if (!app) {
    return fail(context, 404, "Third-party app not found")
  }

  return ok(context, formatThirdPartyApp(app))
}

export async function updateThirdPartyApp(
  context: Context<ServerBindings>,
  params: ThirdPartyAppParams,
  body: UpdateThirdPartyAppBody
) {
  const userId = requireUserId(context)

  try {
    const app = await thirdPartyAppsService.updateApp({
      userId,
      appSlug: params.appSlug,
      displayName: body.displayName,
      websiteUrl: body.websiteUrl,
      metadata: body.metadata,
    })

    if (!app) {
      return fail(context, 404, "Third-party app not found")
    }

    return ok(context, formatThirdPartyApp(app))
  } catch (error) {
    return fail(
      context,
      400,
      error instanceof Error ? error.message : "Failed to update third-party app"
    )
  }
}

export async function deleteThirdPartyApp(
  context: Context<ServerBindings>,
  params: ThirdPartyAppParams
) {
  const userId = requireUserId(context)
  const app = await thirdPartyAppsService.deactivateApp(userId, params.appSlug)

  if (!app) {
    return fail(context, 404, "Third-party app not found")
  }

  return ok(context, {
    deleted: true as const,
  })
}
