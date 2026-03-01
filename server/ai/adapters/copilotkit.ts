import { MastraAgent } from "@ag-ui/mastra"
import { CopilotRuntime } from "@copilotkit/runtime"
import { RequestContext, MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context"
import { mastra } from "@/server/mastra"
import {
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

const COPILOT_AGENT_IDS = [
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
] as const

type CopilotAgentId = (typeof COPILOT_AGENT_IDS)[number]

function createMastraAgent(userId: string, agentId: CopilotAgentId) {
  const requestContext = new RequestContext<Record<string, unknown>>()
  requestContext.set("userId", userId)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId)

  return new MastraAgent({
    agentId,
    agent: mastra.getAgent(agentId),
    resourceId: userId,
    requestContext: requestContext as any,
  })
}

export function createDesktopCopilotRuntime(userId: string) {
  const agents = Object.fromEntries(
    COPILOT_AGENT_IDS.map((agentId) => [agentId, createMastraAgent(userId, agentId)])
  )

  return new CopilotRuntime({
    agents: agents as any,
  })
}
