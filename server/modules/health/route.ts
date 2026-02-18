import type { Hono } from "hono"
import type { ServerBindings } from "@/server/types"

export function registerHealthRoutes(app: Hono<ServerBindings>) {
  app.get("/api/healthz", (context) => {
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
  })
}

