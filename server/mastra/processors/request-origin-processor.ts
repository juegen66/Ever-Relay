import { MASTRA_RESOURCE_ID_KEY, MASTRA_THREAD_ID_KEY } from "@mastra/core/request-context"

import type { ProcessInputArgs } from "@mastra/core/processors"

export const requestOriginProcessor = {
  id: "request-origin",
  name: "Request Origin Logger",

  async processInput({ messages, requestContext }: ProcessInputArgs) {
    const source = requestContext?.get("source") as string | undefined
    const agentId = requestContext?.get("agentId") as string | undefined
    const userId = requestContext?.get("userId") as string | undefined
    const resourceId = requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined
    const threadId = requestContext?.get(MASTRA_THREAD_ID_KEY) as string | undefined

    const parts = [
      source != null && `source=${source}`,
      agentId != null && `agent=${agentId}`,
      userId != null && `userId=${userId}`,
      resourceId != null && `resourceId=${resourceId}`,
      threadId != null && `threadId=${threadId}`,
    ].filter(Boolean)

    const c = { r: "\x1b[0m", bold: "\x1b[1m", cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m" }
    console.warn(`${c.bold}${c.cyan}[RequestOrigin]${c.r} ${c.green}${parts.join(` ${c.yellow}|${c.green} `)}${c.r}`)
    return messages
  },
}
