import type { Hono } from "hono"
import type { PrepareHandoffBody } from "@/shared/contracts/copilot-handoff"
import { copilotHandoffContracts } from "@/shared/contracts/copilot-handoff"

import { getValidatedBody } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import { prepareHandoff } from "./copilot-handoff.controller"
import {
  handleCopilotRequest,
  handlePredictionCopilotRequest,
} from "./copilot-runtime.controller"

export function registerCopilotRoutes(app: Hono<ServerBindings>) {
  // Handoff API
  app.post(
    "/api/copilot/handoff/prepare",
    authMiddleware,
    validateJsonBody(copilotHandoffContracts.prepare.bodySchema),
    (context) =>
      prepareHandoff(context, getValidatedBody<PrepareHandoffBody>(context))
  )

  // Dedicated prediction runtime (SSE / streaming)
  app.all("/api/copilotkit/predict", authMiddleware, handlePredictionCopilotRequest)
  app.all("/api/copilotkit/predict/*", authMiddleware, handlePredictionCopilotRequest)

  // Shared desktop runtime (SSE / streaming)
  app.all("/api/copilotkit", authMiddleware, handleCopilotRequest)
  app.all("/api/copilotkit/*", authMiddleware, handleCopilotRequest)
}
