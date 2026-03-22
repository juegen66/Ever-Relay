
import { getValidatedQuery } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateQuery } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import { agentActivityContracts } from "@/shared/contracts/agent-activity"

import {
  getAgentActivityFeed,
  listOfflineAgentRegistrations,
} from "./agent-activity.controller"

import type { Hono } from "hono"

export function registerAgentActivityRoutes(app: Hono<ServerBindings>) {
  app.get(
    "/api/agent-activity/feed",
    authMiddleware,
    validateQuery(agentActivityContracts.feed.querySchema),
    (context) => getAgentActivityFeed(context, getValidatedQuery(context))
  )

  app.get(
    "/api/agent-activity/offline-agents",
    authMiddleware,
    (context) => listOfflineAgentRegistrations(context)
  )
}

