import { createStep } from "@mastra/inngest"

import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"
import { offlineContextService } from "@/server/mastra/offline/offline-context.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"
import { offlineProactiveWorkflowInputSchema } from "@/shared/contracts/offline-proactive"

import { offlineProactiveGatherContextStepOutputSchema } from "./schemas"

function serializeRunnableAgents(
  agents: Awaited<ReturnType<typeof agentRegistryService.listRunnableOfflineAgents>>
) {
  return agents.map((agent) => ({
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description ?? null,
    metadata: agent.metadata ?? {},
  }))
}

function buildResult(
  inputData: { userId: string; forceRun?: boolean },
  options: {
    context: string
    runnableAgents: ReturnType<typeof serializeRunnableAgents>
    recentTextFiles: Awaited<
      ReturnType<typeof offlineContextService.getFullContext>
    >["recentTextFiles"]
    skip: boolean
    skipReason?: string
  }
) {
  return {
    ...inputData,
    context: options.context,
    runnableAgents: options.runnableAgents,
    recentTextFiles: options.recentTextFiles,
    skip: options.skip,
    skipReason: options.skipReason,
  }
}

export const gatherOfflineProactiveContextStep = createStep({
  id: "offline_proactive_gather_context",
  description:
    "Gather a broad AFS context snapshot for offline proactive planning and apply the recent-activity gate.",
  inputSchema: offlineProactiveWorkflowInputSchema,
  outputSchema: offlineProactiveGatherContextStepOutputSchema,
  execute: async ({ inputData }) => {
    await agentRegistryService.syncDefaultRegistryEntries()

    const [runnableAgents, context] = await Promise.all([
      agentRegistryService.listRunnableOfflineAgents(),
      offlineContextService.getFullContext(inputData.userId),
    ])

    const serializedRunnableAgents = serializeRunnableAgents(runnableAgents)
    const formattedContext = offlineContextService.formatFullContext(
      context,
      runnableAgents
    )

    if (runnableAgents.length === 0) {
      return buildResult(inputData, {
        context: formattedContext,
        runnableAgents: serializedRunnableAgents,
        recentTextFiles: context.recentTextFiles,
        skip: true,
        skipReason:
          "No runnable offline agents are currently registered for proactive execution.",
      })
    }

    if (inputData.forceRun) {
      const textEditAgentAvailable = runnableAgents.some(
        (agent) => agent.agentId === TEXTEDIT_PROACTIVE_AGENT_ID
      )

      if (!textEditAgentAvailable) {
        return buildResult(inputData, {
          context: formattedContext,
          runnableAgents: serializedRunnableAgents,
          recentTextFiles: context.recentTextFiles,
          skip: true,
          skipReason:
            "Force-run requested, but the TextEdit Proactive Agent is not available for offline execution.",
        })
      }
    }

    if (!inputData.forceRun && context.isRecentlyActive) {
      return buildResult(inputData, {
        context: formattedContext,
        runnableAgents: serializedRunnableAgents,
        recentTextFiles: context.recentTextFiles,
        skip: true,
        skipReason:
          "The user has recent foreground activity inside the last 45 minutes, so offline proactive work should be skipped for now.",
      })
    }

    return buildResult(inputData, {
      context: formattedContext,
      runnableAgents: serializedRunnableAgents,
      recentTextFiles: context.recentTextFiles,
      skip: false,
    })
  },
})
