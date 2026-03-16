import { MastraAgent } from "@ag-ui/mastra"
import { CopilotRuntime } from "@copilotkit/runtime"
import { RequestContext, MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context"

import { mastra } from "@/server/mastra"
import { PREDICTION_AGENT_ID } from "@/server/mastra/agents/shared/prediction-agent"
import {
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

const COPILOT_AGENT_IDS = [
  DESKTOP_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  PREDICTION_AGENT_ID,
] as const

type CopilotAgentId = (typeof COPILOT_AGENT_IDS)[number]
type CopilotRuntimeAgents = NonNullable<
  NonNullable<ConstructorParameters<typeof CopilotRuntime>[0]>["agents"]
>

function createMastraAgent(userId: string, agentId: CopilotAgentId) {
  const requestContext = new RequestContext()
  requestContext.set("userId", userId)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId)

  return new MastraAgent({
    agentId,
    agent: mastra.getAgent(agentId),
    resourceId: userId,
    requestContext,
  })
}

export function createDesktopCopilotRuntime(userId: string) {
  const agents = Object.fromEntries(
    COPILOT_AGENT_IDS.map((agentId) => [agentId, createMastraAgent(userId, agentId)])
  ) as CopilotRuntimeAgents

  return new CopilotRuntime({
    agents,
  })
}
