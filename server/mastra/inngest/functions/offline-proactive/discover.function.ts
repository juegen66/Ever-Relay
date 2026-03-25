import { createStep } from "@mastra/inngest"

import { offlineDiscoveryAgent } from "@/server/mastra/agents/proactive/offline-discovery-agent"
import model from "@/server/mastra/model"
import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"
import { offlineContextService } from "@/server/mastra/offline/offline-context.service"
import { agentRegistryService } from "@/server/modules/agent-activity/agent-registry.service"
import {
  offlineDiscoveryOutputSchema,
  type OfflineProactiveWorkflowInput,
} from "@/shared/contracts/offline-proactive"

import {
  offlineProactiveDiscoveryStepOutputSchema,
} from "./schemas"

const DEFAULT_SKIP_TASK = "Skip this run."
const FORCE_TEST_TASK =
  "[FORCE_TEST] Create a conservative candidate draft for the most recent TextEdit file."
type DiscoveryContext = Awaited<
  ReturnType<typeof offlineContextService.getDiscoveryContext>
>

function buildSkipResult(
  inputData: OfflineProactiveWorkflowInput,
  background: string
) {
  return {
    ...inputData,
    background,
    task: DEFAULT_SKIP_TASK,
    targetAgentId: "",
  }
}

function buildForceRunTextEditResult(
  inputData: OfflineProactiveWorkflowInput,
  context: DiscoveryContext
) {
  const sourceFile = context.recentTextFiles[0]

  if (!sourceFile) {
    return buildSkipResult(
      inputData,
      "Force-run requested, but no recent TextEdit file is available for testing."
    )
  }

  return {
    ...inputData,
    background: [
      "Force-run test mode: bypassed the recent desktop activity gate.",
      `source file id=${sourceFile.id}`,
      `source file name=${sourceFile.name}`,
      `source content version=${sourceFile.contentVersion}`,
      `source updated at=${sourceFile.updatedAt}`,
      `source preview=${sourceFile.preview}`,
    ].join("\n"),
    task: FORCE_TEST_TASK,
    targetAgentId: TEXTEDIT_PROACTIVE_AGENT_ID,
  }
}

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
      return buildSkipResult(
        inputData,
        "No runnable offline agents are currently registered for proactive execution."
      )
    }

    if (inputData.forceRun) {
      const textEditAgentAvailable = runnableAgents.some(
        (agent) => agent.agentId === TEXTEDIT_PROACTIVE_AGENT_ID
      )

      if (!textEditAgentAvailable) {
        return buildSkipResult(
          inputData,
          "Force-run requested, but the TextEdit Proactive Agent is not available for offline execution."
        )
      }

      return buildForceRunTextEditResult(inputData, context)
    }

    if (context.isRecentlyActive) {
      return buildSkipResult(
        inputData,
        "The user has recent desktop activity inside the last 45 minutes, so offline proactive work should be skipped for now."
      )
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
