import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import type {
  ThirdPartyMcpBindingParams,
  UpsertThirdPartyMcpBindingBody,
} from "@/shared/contracts/third-party-mcp"

import { thirdPartyMcpService } from "./third-party-mcp.service"

import type { Context } from "hono"


function formatBinding(
  binding: NonNullable<Awaited<ReturnType<typeof thirdPartyMcpService.getBindingForUserApp>>>
) {
  return {
    id: binding.id,
    userId: binding.userId,
    appSlug: binding.appSlug,
    serverUrl: binding.serverUrl,
    authType: binding.authType,
    hasAuthToken: Boolean(binding.authToken),
    isActive: binding.isActive,
    metadata: binding.metadata,
    createdAt: binding.createdAt.toISOString(),
    updatedAt: binding.updatedAt.toISOString(),
  }
}

export async function getThirdPartyMcpBinding(
  context: Context<ServerBindings>,
  params: ThirdPartyMcpBindingParams
) {
  const userId = requireUserId(context)
  const binding = await thirdPartyMcpService.getBindingForUserApp(userId, params.appSlug)

  return ok(context, {
    binding: binding ? formatBinding(binding) : null,
  })
}

export async function upsertThirdPartyMcpBinding(
  context: Context<ServerBindings>,
  params: ThirdPartyMcpBindingParams,
  body: UpsertThirdPartyMcpBindingBody
) {
  const userId = requireUserId(context)

  try {
    const binding = await thirdPartyMcpService.upsertBinding({
      userId,
      appSlug: params.appSlug,
      serverUrl: body.serverUrl,
      authType: body.authType,
      authToken: body.authToken,
      metadata: body.metadata,
    })

    return ok(context, formatBinding(binding))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save third-party MCP binding"
    return fail(context, 400, message)
  }
}

export async function deleteThirdPartyMcpBinding(
  context: Context<ServerBindings>,
  params: ThirdPartyMcpBindingParams
) {
  const userId = requireUserId(context)
  const deleted = await thirdPartyMcpService.deactivateBinding(userId, params.appSlug)

  if (!deleted) {
    return fail(context, 404, "Third-party MCP binding not found")
  }

  return ok(context, {
    deleted: true as const,
  })
}
