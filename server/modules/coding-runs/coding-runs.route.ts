import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import { codingRunsContracts } from "@/shared/contracts/coding-runs"
import type {
  CodingRunIdParams,
  CreateCodingRunParams,
} from "@/shared/contracts/coding-runs"

import { getCodingRun, triggerCodingRun } from "./coding-runs.controller"

import type { Hono } from "hono"

export function registerCodingRunsRoutes(app: Hono<ServerBindings>) {
  app.post(
    "/api/coding-runs",
    authMiddleware,
    validateJsonBody(codingRunsContracts.createCodingRun.bodySchema),
    (context) =>
      triggerCodingRun(context, getValidatedBody<CreateCodingRunParams>(context))
  )

  app.get(
    "/api/coding-runs/:id",
    authMiddleware,
    validateParams(codingRunsContracts.getCodingRun.paramsSchema),
    (context) =>
      getCodingRun(context, getValidatedParams<CodingRunIdParams>(context))
  )
}
