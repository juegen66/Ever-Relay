import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import type {
  CreateThirdPartyAppBody,
  ThirdPartyAppParams,
  UpdateThirdPartyAppBody,
} from "@/shared/contracts/third-party-apps"
import { thirdPartyAppsContracts } from "@/shared/contracts/third-party-apps"

import {
  createThirdPartyApp,
  deleteThirdPartyApp,
  getThirdPartyApp,
  listThirdPartyApps,
  updateThirdPartyApp,
} from "./third-party-apps.controller"

import type { Hono } from "hono"

export function registerThirdPartyAppsRoutes(app: Hono<ServerBindings>) {
  app.get("/api/third-party-apps", authMiddleware, (context) => listThirdPartyApps(context))

  app.post(
    "/api/third-party-apps",
    authMiddleware,
    validateJsonBody(thirdPartyAppsContracts.createApp.bodySchema),
    (context) =>
      createThirdPartyApp(context, getValidatedBody<CreateThirdPartyAppBody>(context))
  )

  app.get(
    "/api/third-party-apps/:appSlug",
    authMiddleware,
    validateParams(thirdPartyAppsContracts.getApp.paramsSchema),
    (context) =>
      getThirdPartyApp(context, getValidatedParams<ThirdPartyAppParams>(context))
  )

  app.put(
    "/api/third-party-apps/:appSlug",
    authMiddleware,
    validateParams(thirdPartyAppsContracts.updateApp.paramsSchema),
    validateJsonBody(thirdPartyAppsContracts.updateApp.bodySchema),
    (context) =>
      updateThirdPartyApp(
        context,
        getValidatedParams<ThirdPartyAppParams>(context),
        getValidatedBody<UpdateThirdPartyAppBody>(context)
      )
  )

  app.delete(
    "/api/third-party-apps/:appSlug",
    authMiddleware,
    validateParams(thirdPartyAppsContracts.deleteApp.paramsSchema),
    (context) =>
      deleteThirdPartyApp(context, getValidatedParams<ThirdPartyAppParams>(context))
  )
}
