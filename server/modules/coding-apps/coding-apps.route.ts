import type { Hono } from "hono"

import { codingAppsContracts } from "@/shared/contracts/coding-apps"
import type {
  CodingAppIdParams,
  CreateCodingAppParams,
} from "@/shared/contracts/coding-apps"
import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"

import {
  activateCodingApp,
  createCodingApp,
  getCodingApp,
  listCodingApps,
} from "./coding-apps.controller"

export function registerCodingAppsRoutes(app: Hono<ServerBindings>) {
  app.get("/api/coding-apps", authMiddleware, (context) => listCodingApps(context))

  app.post(
    "/api/coding-apps",
    authMiddleware,
    validateJsonBody(codingAppsContracts.createCodingApp.bodySchema),
    (context) =>
      createCodingApp(context, getValidatedBody<CreateCodingAppParams>(context))
  )

  app.get(
    "/api/coding-apps/:id",
    authMiddleware,
    validateParams(codingAppsContracts.getCodingApp.paramsSchema),
    (context) => getCodingApp(context, getValidatedParams<CodingAppIdParams>(context))
  )

  app.post(
    "/api/coding-apps/:id/activate",
    authMiddleware,
    validateParams(codingAppsContracts.activateCodingApp.paramsSchema),
    (context) =>
      activateCodingApp(context, getValidatedParams<CodingAppIdParams>(context))
  )
}
