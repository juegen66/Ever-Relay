import type { Hono } from "hono"

import type { RemoveBackgroundParams } from "@/shared/contracts/image-processing"
import { imageProcessingContracts } from "@/shared/contracts/image-processing"
import { getValidatedBody } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody } from "@/server/middlewares/validation"
import { removeBackground } from "./image-processing.controller"
import type { ServerBindings } from "@/server/types"

export function registerImageProcessingRoutes(app: Hono<ServerBindings>) {
  app.post(
    "/api/image-processing/remove-background",
    authMiddleware,
    validateJsonBody(imageProcessingContracts.removeBackground.bodySchema),
    (context) =>
      removeBackground(context, getValidatedBody<RemoveBackgroundParams>(context))
  )
}
