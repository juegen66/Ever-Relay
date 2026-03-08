import {
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime"
import type { Context, Hono } from "hono"
import type { PrepareHandoffBody } from "@/shared/contracts/copilot-handoff"
import { copilotHandoffContracts } from "@/shared/contracts/copilot-handoff"

import { createDesktopCopilotRuntime } from "@/server/ai/adapters/copilotkit"
import { getValidatedBody } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import { DESKTOP_COPILOT_ENDPOINT } from "@/shared/copilot/constants"
import { prepareHandoff } from "./copilot-handoff.controller"

async function handleCopilotRequest(context: Context<ServerBindings>) {
  // if (!process.env.OPENAI_API_KEY) {
  //   return context.json(
  //     {
  //       error: "OPENAI_API_KEY is missing. Configure it before using Copilot.",
  //     },
  //     500
  //   )
  // }

  const user = context.get("user")
  if (!user?.id) {
    return context.json({ error: "Unauthorized" }, 401)
  }

  const runtimeForUser = createDesktopCopilotRuntime(user.id)

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeForUser,
    endpoint: DESKTOP_COPILOT_ENDPOINT,
    serviceAdapter: new EmptyAdapter(),
  })

  return handleRequest(context.req.raw)
}

export function registerCopilotRoutes(app: Hono<ServerBindings>) {
  app.post(
    "/api/copilot/handoff/prepare",
    authMiddleware,
    validateJsonBody(copilotHandoffContracts.prepare.bodySchema),
    (context) =>
      prepareHandoff(context, getValidatedBody<PrepareHandoffBody>(context))
  )

  app.all("/api/copilotkit", authMiddleware, handleCopilotRequest)
  app.all("/api/copilotkit/*", authMiddleware, handleCopilotRequest)
}
