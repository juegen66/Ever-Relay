import type { MiddlewareHandler } from "hono"
import type { ServerBindings } from "@/server/types"

export const loggerMiddleware: MiddlewareHandler<ServerBindings> = async (
  context,
  next
) => {
  const startedAt = Date.now()
  await next()

  const durationMs = Date.now() - startedAt
  const requestId = context.get("requestId")

  console.info(
    `[api] ${context.req.method} ${context.req.path} ${context.res.status} ${durationMs}ms rid=${requestId}`
  )
}

