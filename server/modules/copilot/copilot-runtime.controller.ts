import {
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime"
import type { Context } from "hono"

import {
  createDesktopCopilotRuntime,
  createPredictionCopilotRuntime,
} from "@/server/ai/adapters/copilotkit"
import type { ServerBindings } from "@/server/types"
import {
  DESKTOP_COPILOT_ENDPOINT,
  DESKTOP_PREDICTION_ENDPOINT,
} from "@/shared/copilot/constants"

async function handleRuntimeRequest(
  context: Context<ServerBindings>,
  options: {
    endpoint: string
    runtimeFactory: (userId: string) => ReturnType<typeof createDesktopCopilotRuntime>
  }
) {
  const user = context.get("user")
  if (!user?.id) {
    return context.json({ error: "Unauthorized" }, 401)
  }

  const runtimeForUser = options.runtimeFactory(user.id)

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeForUser,
    endpoint: options.endpoint,
    serviceAdapter: new EmptyAdapter(),
  })

  return handleRequest(context.req.raw)
}

export async function handleCopilotRequest(context: Context<ServerBindings>) {
  return handleRuntimeRequest(context, {
    endpoint: DESKTOP_COPILOT_ENDPOINT,
    runtimeFactory: createDesktopCopilotRuntime,
  })
}

export async function handlePredictionCopilotRequest(context: Context<ServerBindings>) {
  return handleRuntimeRequest(context, {
    endpoint: DESKTOP_PREDICTION_ENDPOINT,
    runtimeFactory: createPredictionCopilotRuntime,
  })
}
