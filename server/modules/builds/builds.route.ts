import type { Hono } from "hono"
import type {
  BuildRunIdParams,
  CreateBuildParams,
} from "@/shared/contracts/builds"
import { buildsContracts } from "@/shared/contracts/builds"
import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import { getBuildStatus, triggerBuild } from "./builds.controller"

export function registerBuildsRoutes(app: Hono<ServerBindings>) {
  app.post(
    "/api/builds",
    authMiddleware,
    validateJsonBody(buildsContracts.createBuild.bodySchema),
    (context) => triggerBuild(context, getValidatedBody<CreateBuildParams>(context))
  )

  app.get(
    "/api/builds/:id",
    authMiddleware,
    validateParams(buildsContracts.getBuildStatus.paramsSchema),
    (context) =>
      getBuildStatus(context, getValidatedParams<BuildRunIdParams>(context))
  )
}

