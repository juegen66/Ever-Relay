import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import type {
  ThirdPartyMcpBindingParams,
  UpsertThirdPartyMcpBindingBody,
} from "@/shared/contracts/third-party-mcp"
import { thirdPartyMcpContracts } from "@/shared/contracts/third-party-mcp"

import {
  deleteThirdPartyMcpBinding,
  getThirdPartyMcpBinding,
  upsertThirdPartyMcpBinding,
} from "./third-party-mcp.controller"

import type { Hono } from "hono"


export function registerThirdPartyMcpRoutes(app: Hono<ServerBindings>) {
  app.get(
    "/api/third-party-mcp/bindings/:appSlug",
    authMiddleware,
    validateParams(thirdPartyMcpContracts.getBinding.paramsSchema),
    (context) =>
      getThirdPartyMcpBinding(
        context,
        getValidatedParams<ThirdPartyMcpBindingParams>(context)
      )
  )

  app.put(
    "/api/third-party-mcp/bindings/:appSlug",
    authMiddleware,
    validateParams(thirdPartyMcpContracts.upsertBinding.paramsSchema),
    validateJsonBody(thirdPartyMcpContracts.upsertBinding.bodySchema),
    (context) =>
      upsertThirdPartyMcpBinding(
        context,
        getValidatedParams<ThirdPartyMcpBindingParams>(context),
        getValidatedBody<UpsertThirdPartyMcpBindingBody>(context)
      )
  )

  app.delete(
    "/api/third-party-mcp/bindings/:appSlug",
    authMiddleware,
    validateParams(thirdPartyMcpContracts.deleteBinding.paramsSchema),
    (context) =>
      deleteThirdPartyMcpBinding(
        context,
        getValidatedParams<ThirdPartyMcpBindingParams>(context)
      )
  )
}
