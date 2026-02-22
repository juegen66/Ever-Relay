import type { Hono } from "hono"
import type { ServerBindings } from "@/server/types"
import { handleAuthRequest } from "@/server/modules/auth/auth.controller"

export function registerAuthRoutes(app: Hono<ServerBindings>) {
  app.all("/api/auth", (context) => handleAuthRequest(context.req.raw))
  app.all("/api/auth/*", (context) => handleAuthRequest(context.req.raw))
}
