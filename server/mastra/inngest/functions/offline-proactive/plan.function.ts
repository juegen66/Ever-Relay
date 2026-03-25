import { createStep } from "@mastra/inngest"

import { offlineDiscoveryAgent } from "@/server/mastra/agents/proactive/offline-discovery-agent"
import model from "@/server/mastra/model"
import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"

import {
  offlineProactiveGatherContextStepOutputSchema,
  offlineProactiveLoopStepSchema,
  offlineProactivePlanSchema,
  offlineProactivePlanTaskSchema,
  offlineProactiveWorkflowStateSchema,
} from "./schemas"

const DEFAULT_EMPTY_PLAN_REASON =
  "Planner did not find an actionable offline proactive task."

function normalizeTaskAgentId(
  agentId: string,
  allowedAgentIds: string[],
  defaultAgentId: string
) {
  const candidate = agentId.trim()
  if (!candidate) {
    return defaultAgentId
  }

  return allowedAgentIds.includes(candidate) ? candidate : defaultAgentId
}

function buildPlannerPrompt(inputData: {
  context: string
  runnableAgents: Array<{
    agentId: string
    name: string
    description?: string | null
  }>
}) {
  const allowedAgentIds = inputData.runnableAgents.map((agent) => agent.agentId)
  const runnableAgentsText =
    inputData.runnableAgents.length > 0
      ? inputData.runnableAgents
          .map(
            (agent) =>
              `- ${agent.agentId} | ${agent.name} | ${agent.description ?? "No description"}`
          )
          .join("\n")
      : "- none"

  return [
    "Create a dependency-aware offline proactive execution plan.",
    "Return a JSON object with a tasks array.",
    "Tasks must use only the available agent ids.",
    "If there is no high-value action worth taking right now, return tasks: [].",
    "Keep the plan compact. Prefer 1-3 tasks.",
    "Do not invent new files, source ids, or user intent.",
    "Only include dependencies when one task truly must finish before another starts.",
    "",
    `Allowed task agent ids: ${allowedAgentIds.join(", ") || "none"}`,
    "Each task must include: id, name, agentId, dependsOn, location, prerequisites, description, acceptanceCriteria, validation.",
    "Task descriptions should be worker-ready and concise.",
    "",
    "Runnable offline agents:",
    runnableAgentsText,
    "",
    "Planning context:",
    inputData.context,
  ].join("\n")
}

function buildForceRunTask(inputData: {
  recentTextFiles: Array<{
    id: string
    name: string
    contentVersion: number
    updatedAt: string
    preview: string
  }>
}) {
  const sourceFile = inputData.recentTextFiles[0]

  if (!sourceFile) {
    return {
      plan: {
        tasks: [],
      },
      synthesis:
        "Force-run requested, but no recent TextEdit file is available for testing.",
      done: true,
    }
  }

  return {
    plan: {
      tasks: [
        offlineProactivePlanTaskSchema.parse({
          id: "T1",
          name: "Force-run TextEdit draft",
          agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
          dependsOn: [],
          location: sourceFile.name,
          prerequisites: [
            "Force-run test mode: bypassed the recent desktop activity gate.",
            `source file id=${sourceFile.id}`,
            `source file name=${sourceFile.name}`,
            `source content version=${sourceFile.contentVersion}`,
            `source updated at=${sourceFile.updatedAt}`,
            `source preview=${sourceFile.preview}`,
          ].join("\n"),
          description:
            "[FORCE_TEST] Create a conservative candidate draft for the most recent TextEdit file.",
          acceptanceCriteria: [
            "Verify the cited source file before drafting.",
            "Create a new candidate draft instead of overwriting the source file.",
          ],
          validation:
            "Return completed only if a candidate draft was created or skipped if the source file is missing.",
        }),
      ],
    },
    synthesis: "Force-run injected a deterministic TextEdit offline task.",
    done: false,
  }
}

export const planOfflineProactiveStep = createStep({
  id: "offline_proactive_plan",
  description:
    "Build a dependency-aware offline proactive plan from the broader AFS context.",
  inputSchema: offlineProactiveGatherContextStepOutputSchema,
  outputSchema: offlineProactiveLoopStepSchema,
  stateSchema: offlineProactiveWorkflowStateSchema,
  execute: async ({ inputData, requestContext, setState }) => {
    const allowedAgentIds = inputData.runnableAgents.map((agent) => agent.agentId)
    const defaultAgentId = allowedAgentIds[0] ?? TEXTEDIT_PROACTIVE_AGENT_ID

    if (inputData.skip) {
      const plan = {
        tasks: [],
      }

      await setState({
        plan,
        completedTaskIds: [],
        allReports: [],
      })

      return {
        userId: inputData.userId,
        forceRun: inputData.forceRun,
        done: true,
        synthesis: inputData.skipReason ?? DEFAULT_EMPTY_PLAN_REASON,
        plan,
      }
    }

    if (inputData.forceRun) {
      const forced = buildForceRunTask(inputData)

      await setState({
        plan: forced.plan,
        completedTaskIds: [],
        allReports: [],
      })

      return {
        userId: inputData.userId,
        forceRun: inputData.forceRun,
        ...forced,
      }
    }

    const response = await offlineDiscoveryAgent.generate(
      buildPlannerPrompt(inputData),
      {
        requestContext,
        maxSteps: 1,
        toolChoice: "none",
        structuredOutput: {
          schema: offlineProactivePlanSchema,
          model: model.lzmodel4oMini,
          jsonPromptInjection: true,
        },
      }
    )

    const plan = offlineProactivePlanSchema.parse({
      tasks: response.object.tasks.map((task) => ({
        ...task,
        agentId: normalizeTaskAgentId(
          task.agentId ?? "",
          allowedAgentIds,
          defaultAgentId
        ),
      })),
    })

    await setState({
      plan,
      completedTaskIds: [],
      allReports: [],
    })

    return {
      userId: inputData.userId,
      forceRun: inputData.forceRun,
      done: plan.tasks.length === 0,
      synthesis:
        plan.tasks.length === 0
          ? DEFAULT_EMPTY_PLAN_REASON
          : `Planned ${plan.tasks.length} offline proactive task(s).`,
      plan,
    }
  },
})
