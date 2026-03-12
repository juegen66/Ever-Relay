import {
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime"
import type { Context } from "hono"

import { createDesktopCopilotRuntime } from "@/server/ai/adapters/copilotkit"
import type { ServerBindings } from "@/server/types"
import { DESKTOP_COPILOT_ENDPOINT } from "@/shared/copilot/constants"

export async function handleCopilotRequest(context: Context<ServerBindings>) {
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
