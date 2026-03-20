import { Mastra } from "@mastra/core/mastra"
import { PostgresStore } from "@mastra/pg"
import { pool } from "@/server/core/database"
import { agents } from "@/server/mastra/agents"
import { mastraObservability } from "@/server/mastra/observability-registry"
import { workflows } from "@/server/mastra/workflows"
import { consoleProcessor } from "@/server/mastra/processors/logger"

export const mastra = new Mastra({
  agents,
  workflows,
  storage: new PostgresStore({
    id: "mastra-storage",
    pool,
  }),
  observability: mastraObservability,
  logger: consoleProcessor,
})

export { mastra as default }
