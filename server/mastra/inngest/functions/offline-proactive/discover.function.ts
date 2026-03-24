import { createStep } from "@mastra/inngest"

import { offlineDiscoveryAgent } from "@/server/mastra/agents/proactive/offline-discovery-agent"
import model from "@/server/mastra/model"
import { offlineContextService } from "@/server/mastra/offline/offline-context.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"
import { offlineDiscoveryOutputSchema } from "@/shared/contracts/offline-proactive"

import {
  offlineProactiveDiscoveryStepOutputSchema,
} from "./schemas"

export const discoverOfflineTaskStep = createStep({
  id: "offline_proactive_discover",
  description:
    "Use the fixed discovery agent to decide whether a user has a high-value offline task.",
  inputSchema: offlineProactiveDiscoveryStepOutputSchema.omit({
    background: true,
    task: true,
    targetAgentId: true,
  }),
  outputSchema: offlineProactiveDiscoveryStepOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    await agentRegistryService.syncDefaultRegistryEntries()

    const runnableAgents = await agentRegistryService.listRunnableOfflineAgents()
    const context = await offlineContextService.getDiscoveryContext(inputData.userId)

    if (runnableAgents.length === 0) {
      return {
        ...inputData,
        background: "No runnable offline agents are currently registered for proactive execution.",
        task: "Skip this run.",
        targetAgentId: "",
      }
    }

    if (context.isRecentlyActive) {
      return {
        ...inputData,
        background:
          "The user has recent desktop activity inside the last 45 minutes, so offline proactive work should be skipped for now.",
        task: "Skip this run.",
        targetAgentId: "",
      }
    }

    const response = await offlineDiscoveryAgent.generate(
      offlineContextService.formatDiscoveryPrompt(context, runnableAgents),
      {
        requestContext,
        maxSteps: 1,
        toolChoice: "none",
        structuredOutput: {
          schema: offlineDiscoveryOutputSchema,
          model: model.lzmodel4oMini,
          jsonPromptInjection: true,
        },
      }
    )

    return {
      ...inputData,
      background: response.object.background ?? "",
      task: response.object.task ?? "",
      targetAgentId: response.object.targetAgentId ?? "",
    }
  },
})
