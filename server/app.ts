import { Hono } from "hono"
import { errorHandler } from "@/server/middlewares/error"
import { loggerMiddleware } from "@/server/middlewares/logger"
import { requestIdMiddleware } from "@/server/middlewares/request-id"
import { registerAuthRoutes } from "@/server/modules/auth/auth.route"
import { registerFilesRoutes } from "@/server/modules/files/files.route"
import { registerHealthRoutes } from "@/server/modules/health/health.route"
import type { ServerBindings } from "@/server/types"

export const serverApp = new Hono<ServerBindings>()

serverApp.use("*", requestIdMiddleware)
serverApp.use("*", loggerMiddleware)

registerAuthRoutes(serverApp)
registerFilesRoutes(serverApp)
registerHealthRoutes(serverApp)

serverApp.notFound((context) => {
  const requestId = context.get("requestId")
  return context.json(
    {
      success: false,
      code: 404,
      message: `Route not found: ${context.req.path}`,
      requestId,
    },
    404
  )
})

serverApp.onError(errorHandler)
