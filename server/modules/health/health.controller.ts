import type { Context } from "hono"

import type { HealthResponseData } from "@/shared/contracts/health"
import { ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"

export function getHealth(context: Context<ServerBindings>) {
  const response: HealthResponseData = {
    status: "ok",
    timestamp: new Date().toISOString(),
  }

  return ok(context, response)
}
