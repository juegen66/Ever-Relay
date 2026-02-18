import { HTTPException } from "hono/http-exception"
import type { ErrorHandler } from "hono"
import type { ServerBindings } from "@/server/types"

export const errorHandler: ErrorHandler<ServerBindings> = (error, context) => {
  const requestId = context.get("requestId")
  const status = error instanceof HTTPException ? error.status : 500

  const message =
    status >= 500
      ? "Internal Server Error"
      : error.message || "Request failed"

  if (status >= 500) {
    console.error(`[api] unhandled error rid=${requestId}`, error)
  }

  return context.json(
    {
      success: false,
      code: status,
      message,
      requestId,
    },
    status
  )
}

