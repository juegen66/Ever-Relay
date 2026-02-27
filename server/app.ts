import { Hono } from "hono"
import { errorHandler } from "@/server/middlewares/error"
import { loggerMiddleware } from "@/server/middlewares/logger"
import { requestIdMiddleware } from "@/server/middlewares/request-id"
import { registerAuthRoutes } from "@/server/modules/auth/auth.route"
import { registerCanvasRoutes } from "@/server/modules/canvas/canvas.route"
import { registerCopilotRoutes } from "@/server/modules/copilot/copilot.route"
import { registerBuildsRoutes } from "@/server/modules/builds/builds.route"
import { registerFilesRoutes } from "@/server/modules/files/files.route"
import { registerHealthRoutes } from "@/server/modules/health/health.route"
import { registerImageProcessingRoutes } from "@/server/modules/image-processing/image-processing.route"
import { registerInngestRoutes } from "@/server/modules/inngest/inngest.route"
import type { ServerBindings } from "@/server/types"
import { fail } from "@/server/lib/http/response"

export const serverApp = new Hono<ServerBindings>()

serverApp.use("*", requestIdMiddleware)
serverApp.use("*", loggerMiddleware)

registerAuthRoutes(serverApp)
registerCanvasRoutes(serverApp)
registerCopilotRoutes(serverApp)
registerBuildsRoutes(serverApp)
registerFilesRoutes(serverApp)
registerHealthRoutes(serverApp)
registerImageProcessingRoutes(serverApp)
registerInngestRoutes(serverApp)

serverApp.notFound((context) => {
  return fail(context, 404, `Route not found: ${context.req.path}`)
})

serverApp.onError(errorHandler)
