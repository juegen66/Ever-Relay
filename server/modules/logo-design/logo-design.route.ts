import type { Hono } from "hono"
import type {
  CreateLogoDesignParams,
  LogoDesignAssetIdParams,
  LogoDesignRunIdParams,
} from "@/shared/contracts/logo-design"
import { logoDesignContracts } from "@/shared/contracts/logo-design"
import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import {
  getLogoDesign,
  getLogoDesignAsset,
  getLogoDesignAssets,
  listLogoDesigns,
  triggerLogoDesign,
} from "./logo-design.controller"

export function registerLogoDesignRoutes(app: Hono<ServerBindings>) {
  app.post(
    "/api/logo-designs",
    authMiddleware,
    validateJsonBody(logoDesignContracts.createLogoDesign.bodySchema),
    (context) =>
      triggerLogoDesign(context, getValidatedBody<CreateLogoDesignParams>(context))
  )

  app.get("/api/logo-designs", authMiddleware, (context) =>
    listLogoDesigns(context)
  )

  app.get(
    "/api/logo-designs/:id",
    authMiddleware,
    validateParams(logoDesignContracts.getLogoDesign.paramsSchema),
    (context) =>
      getLogoDesign(context, getValidatedParams<LogoDesignRunIdParams>(context))
  )

  app.get(
    "/api/logo-designs/:id/assets",
    authMiddleware,
    validateParams(logoDesignContracts.getLogoDesignAssets.paramsSchema),
    (context) =>
      getLogoDesignAssets(context, getValidatedParams<LogoDesignRunIdParams>(context))
  )

  app.get(
    "/api/logo-designs/:id/assets/:assetId",
    authMiddleware,
    validateParams(logoDesignContracts.getLogoDesignAsset.paramsSchema),
    (context) =>
      getLogoDesignAsset(context, getValidatedParams<LogoDesignAssetIdParams>(context))
  )
}
