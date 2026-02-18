import type { Hono } from "hono"
import type { ServerBindings } from "@/server/types"
import { auth, ensureAuthMigrations } from "@/server/modules/auth/service"

async function handleAuthRequest(request: Request) {
  await ensureAuthMigrations()
  return auth.handler(request)
}

export function registerAuthRoutes(app: Hono<ServerBindings>) {
  app.all("/api/auth", (context) => handleAuthRequest(context.req.raw))
  app.all("/api/auth/*", (context) => handleAuthRequest(context.req.raw))
}

