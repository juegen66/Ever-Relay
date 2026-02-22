import type { Hono } from "hono"
import type { ServerBindings } from "@/server/types"
import { getHealth } from "@/server/modules/health/health.controller"

export function registerHealthRoutes(app: Hono<ServerBindings>) {
  app.get("/api/healthz", getHealth)
}
