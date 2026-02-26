import { MastraAgent } from "@ag-ui/mastra"
import { CopilotRuntime } from "@copilotkit/runtime"
import { RequestContext, MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context"
import { mastra } from "@/server/mastra"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export function createDesktopMastraAgent(userId: string) {
  const requestContext = new RequestContext<Record<string, unknown>>()
  requestContext.set("userId", userId)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId)

  return new MastraAgent({
    agentId: DESKTOP_COPILOT_AGENT,
    agent: mastra.getAgent(DESKTOP_COPILOT_AGENT),
    resourceId: userId,
    requestContext: requestContext as any,
  })
}

export function createDesktopCopilotRuntime(userId: string) {
  return new CopilotRuntime({
    agents: {
      [DESKTOP_COPILOT_AGENT]: createDesktopMastraAgent(userId),
    } as any,
  })
}
