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

const SHARED_COPILOT_AGENT_IDS = [
  DESKTOP_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
] as const

const PREDICTION_COPILOT_AGENT_IDS = [PREDICTION_AGENT_ID] as const

type CopilotAgentId =
  | (typeof SHARED_COPILOT_AGENT_IDS)[number]
  | (typeof PREDICTION_COPILOT_AGENT_IDS)[number]
type CopilotRuntimeAgents = NonNullable<
  NonNullable<ConstructorParameters<typeof CopilotRuntime>[0]>["agents"]
>

function createMastraAgent(
  userId: string,
  agentId: CopilotAgentId,
  source: "desktop" | "prediction"
) {
  const requestContext = new RequestContext()
  requestContext.set("userId", userId)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId)
  requestContext.set("agentId", agentId)
  requestContext.set("source", source)

  return new MastraAgent({
    agentId,
    agent: mastra.getAgent(agentId),
    resourceId: userId,
    requestContext,
  })
}

function createCopilotRuntimeForAgents(
  userId: string,
  agentIds: readonly CopilotAgentId[],
  source: "desktop" | "prediction"
) {
  const agents = Object.fromEntries(
    agentIds.map((agentId) => [agentId, createMastraAgent(userId, agentId, source)])
  ) as CopilotRuntimeAgents

  return new CopilotRuntime({
    agents,
  })
}

export function createDesktopCopilotRuntime(userId: string) {
  return createCopilotRuntimeForAgents(userId, SHARED_COPILOT_AGENT_IDS, "desktop")
}

export function createPredictionCopilotRuntime(userId: string) {
  return createCopilotRuntimeForAgents(userId, PREDICTION_COPILOT_AGENT_IDS, "prediction")
}
