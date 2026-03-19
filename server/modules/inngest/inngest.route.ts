import { serve } from "@mastra/inngest"

import { mastra } from "@/server/mastra"
import { inngest } from "@/server/mastra/inngest/client"
import { afsMemoryDecayFunction } from "@/server/mastra/inngest/functions/memory/decay.function"
import type { ServerBindings } from "@/server/types"

import type { Hono } from "hono"

const inngestHandler = serve({
  mastra,
  inngest,
  functions: [afsMemoryDecayFunction],
})

export function registerInngestRoutes(app: Hono<ServerBindings>) {
  app.all("/api/inngest", (context) => {
    return inngestHandler(context)
  })
  app.all("/api/inngest/*", (context) => {
    return inngestHandler(context)
  })
}
