import { serve } from "@mastra/inngest"
import type { Hono } from "hono"
import { mastra } from "@/server/mastra"
import { inngest } from "@/server/mastra/inngest/client"
import type { ServerBindings } from "@/server/types"

const inngestHandler = serve({
  mastra,
  inngest,
})

export function registerInngestRoutes(app: Hono<ServerBindings>) {
  app.all("/api/inngest", (context) => {
    return inngestHandler(context)
  })
  app.all("/api/inngest/*", (context) => {
    return inngestHandler(context)
  })
}
