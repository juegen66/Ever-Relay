import type { MiddlewareHandler } from "hono"
import type { ServerBindings } from "@/server/types"

export const requestIdMiddleware: MiddlewareHandler<ServerBindings> = async (
  context,
  next
) => {
  const incomingRequestId = context.req.header("x-request-id")
  const requestId =
    incomingRequestId && incomingRequestId.trim()
      ? incomingRequestId
      : crypto.randomUUID()

  context.set("requestId", requestId)
  await next()
  context.header("x-request-id", requestId)
}

