import { Mastra } from "@mastra/core/mastra"
import { agents } from "@/server/mastra/agents"
import { workflows } from "@/server/mastra/workflows"
import { consoleProcessor } from "@/server/mastra/processors/logger"

export const mastra = new Mastra({
  agents,
  workflows,
  logger: consoleProcessor,
})

export { mastra as default }
