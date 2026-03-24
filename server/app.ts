import { Hono } from "hono"

import { fail } from "@/server/lib/http/response"
import { errorHandler } from "@/server/middlewares/error"
import { loggerMiddleware } from "@/server/middlewares/logger"
import { requestIdMiddleware } from "@/server/middlewares/request-id"
import { registerAfsRoutes } from "@/server/modules/afs/afs.route"
import { registerAgentActivityRoutes } from "@/server/modules/agent-activity/agent-activity.route"
import { registerAuthRoutes } from "@/server/modules/auth/auth.route"
import { registerBuildsRoutes } from "@/server/modules/builds/builds.route"
import { registerCanvasRoutes } from "@/server/modules/canvas/canvas.route"
import { registerCodingAppsRoutes } from "@/server/modules/coding-apps/coding-apps.route"
import { registerCodingRunsRoutes } from "@/server/modules/coding-runs/coding-runs.route"
import { registerCopilotRoutes } from "@/server/modules/copilot/copilot.route"
import { registerFilesRoutes } from "@/server/modules/files/files.route"
import { registerHealthRoutes } from "@/server/modules/health/health.route"
import { registerImageProcessingRoutes } from "@/server/modules/image-processing/image-processing.route"
import { registerInngestRoutes } from "@/server/modules/inngest/inngest.route"
import { registerLogoDesignRoutes } from "@/server/modules/logo-design/logo-design.route"
import { registerThirdPartyAppsRoutes } from "@/server/modules/third-party-apps/third-party-apps.route"
import { registerThirdPartyMcpRoutes } from "@/server/modules/third-party-mcp/third-party-mcp.route"
import type { ServerBindings } from "@/server/types"

export const serverApp = new Hono<ServerBindings>()

serverApp.use("*", requestIdMiddleware)
serverApp.use("*", loggerMiddleware)

registerAfsRoutes(serverApp)
registerAuthRoutes(serverApp)
registerCanvasRoutes(serverApp)
registerCodingAppsRoutes(serverApp)
registerCopilotRoutes(serverApp)
registerCodingRunsRoutes(serverApp)
registerBuildsRoutes(serverApp)
registerFilesRoutes(serverApp)
registerHealthRoutes(serverApp)
registerImageProcessingRoutes(serverApp)
registerInngestRoutes(serverApp)
registerAgentActivityRoutes(serverApp)
registerLogoDesignRoutes(serverApp)
registerThirdPartyAppsRoutes(serverApp)
registerThirdPartyMcpRoutes(serverApp)

serverApp.notFound((context) => {
  return fail(context, 404, `Route not found: ${context.req.path}`)
})

serverApp.onError(errorHandler)
