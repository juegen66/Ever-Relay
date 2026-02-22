import type { Context } from "hono"
import type { ServerBindings } from "@/server/types"

export function getHealth(context: Context<ServerBindings>) {
  const requestId = context.get("requestId")
  return context.json({
    success: true,
    code: 0,
    data: {
      status: "ok",
      requestId,
      timestamp: new Date().toISOString(),
    },
  })
}


