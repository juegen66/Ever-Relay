import { createStep, createWorkflow } from "@mastra/core/workflows"
import { z } from "zod"

import model from "@/server/mastra/model"
import {
  buildParallelTaskPrompt,
} from "@/server/mastra/workflows/parallel-workflow/build-task-prompt"
import {
  buildParallelSynthesis,
  finalizeParallelTaskReport,
  getExecutableParallelTasks,
  normalizeParallelTaskAgentId,
  uniqStrings,
} from "@/server/mastra/workflows/parallel-workflow/helpers"
import {
  getParallelWorkflowSourceConfig,
} from "@/server/mastra/workflows/parallel-workflow/registry"
import {
  parallelPlanSchema,
  parallelTaskReportSchema,
  parallelWorkflowInputSchema,
  parallelWorkflowOutputSchema,
  parallelWorkflowStateSchema,
  type ParallelPlan,
  type ParallelTask,
} from "@/server/mastra/workflows/parallel-workflow/types"

const waveInputSchema = parallelPlanSchema.or(
  parallelWorkflowOutputSchema.extend({
    plan: parallelPlanSchema,
  })
)

const waveOutputSchema = z.object({
  done: z.boolean(),
  synthesis: z.string(),
  plan: parallelPlanSchema,
})

export const PARALLEL_WORKFLOW_ID = "parallelWorkflow"

const planStep = createStep({
  id: "parallel-plan-step",
  description: "Create a dependency-aware execution plan for the parallel workflow",
  inputSchema: parallelWorkflowInputSchema,
  outputSchema: parallelPlanSchema,
  stateSchema: parallelWorkflowStateSchema,
  execute: async ({ inputData, mastra, requestContext, setState }) => {
    const config = getParallelWorkflowSourceConfig(inputData.sourceAgentId)
    if (!config) {
      throw new Error(`No parallel workflow config found for ${inputData.sourceAgentId}`)
    }

    const planner = mastra?.getAgent(config.plannerAgentId)
    if (!planner) {
      throw new Error(`Planner agent "${config.plannerAgentId}" not found`)
    }

    const prompt = [
      "Create a dependency-aware parallel execution plan.",
      `Source agent: ${inputData.sourceAgentId}`,
      `Allowed task agent ids: ${config.allowedTaskAgentIds.join(", ")}`,
      `Default task agent id: ${config.defaultTaskAgentId}`,
      "",
      "Return a JSON object with a tasks array.",
      "Each task must include: id, name, agentId, dependsOn, location, prerequisites, description, acceptanceCriteria, validation.",
      "Only create tasks that materially contribute to fulfilling the request.",
      "Keep the plan compact. Prefer 2-4 tasks.",
      "",
      `Request: ${inputData.request}`,
    ].join("\n")

    const response = await planner.generate(prompt, {
      requestContext,
      maxSteps: 1,
      toolChoice: "none",
      structuredOutput: {
        schema: parallelPlanSchema,
        model: model.lzmodel4oMini,
        jsonPromptInjection: true,
      },
    })

    const plan = response.object

    await setState({
      plan,
      completedTaskIds: [],
      allReports: [],
      sourceAgentId: inputData.sourceAgentId,
    })

    return plan
  },
})

const executeWaveStep = createStep({
  id: "parallel-execute-wave-step",
  description: "Execute every unblocked task in parallel and aggregate reports",
  inputSchema: waveInputSchema,
  outputSchema: waveOutputSchema,
  stateSchema: parallelWorkflowStateSchema,
  execute: async ({
    inputData,
    state,
    setState,
    mastra,
    requestContext,
  }) => {
    const sourceAgentId = state.sourceAgentId
    if (!sourceAgentId) {
      throw new Error("Parallel workflow state is missing sourceAgentId")
    }

    const config = getParallelWorkflowSourceConfig(sourceAgentId)
    if (!config) {
      throw new Error(`No parallel workflow config found for ${sourceAgentId}`)
    }

    const plan: ParallelPlan = "tasks" in inputData ? inputData : inputData.plan
    const completedTaskIds = state.completedTaskIds
    const allReports = state.allReports
    const unblockedTasks = getExecutableParallelTasks(plan, completedTaskIds)

    if (unblockedTasks.length === 0) {
      const synthesis = buildParallelSynthesis(plan, completedTaskIds, allReports)
      return {
        done: true,
        synthesis,
        plan,
      }
    }

    const reports = await Promise.all(
      unblockedTasks.map(async (task: ParallelTask) => {
        const agentId = normalizeParallelTaskAgentId(
          task,
          config.allowedTaskAgentIds,
          config.defaultTaskAgentId
        )
        const agent = mastra?.getAgent(agentId)

        if (!agent) {
          throw new Error(`Parallel workflow agent "${agentId}" not found`)
        }

        const response = await agent.generate(buildParallelTaskPrompt(task), {
          requestContext,
          maxSteps: 5,
          activeTools: [...config.workerActiveTools],
          structuredOutput: {
            schema: parallelTaskReportSchema,
            model: model.lzmodel4oMini,
            jsonPromptInjection: true,
          },
        })

        return finalizeParallelTaskReport(task, response.object)
      })
    )

    const newCompletedTaskIds = reports
      .filter((report) => report.status === "done")
      .map((report) => report.taskId)
    const updatedCompletedTaskIds = uniqStrings([
      ...completedTaskIds,
      ...newCompletedTaskIds,
    ])
    const updatedReports = [...allReports, ...reports]
    const allDone = updatedCompletedTaskIds.length >= plan.tasks.length
    const hasIssues = reports.some((report) => report.status !== "done")
    const madeProgress = newCompletedTaskIds.length > 0
    const shouldFinish = allDone || hasIssues || !madeProgress

    await setState({
      ...state,
      completedTaskIds: updatedCompletedTaskIds,
      allReports: updatedReports,
    })

    return {
      done: shouldFinish,
      synthesis: buildParallelSynthesis(plan, updatedCompletedTaskIds, updatedReports),
      plan,
    }
  },
})

const synthesisStep = createStep({
  id: "parallel-synthesis-step",
  description: "Return the final workflow synthesis",
  inputSchema: waveOutputSchema,
  outputSchema: parallelWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    return {
      synthesis: inputData.synthesis,
    }
  },
})

export const parallelWorkflow = createWorkflow({
  id: PARALLEL_WORKFLOW_ID,
  inputSchema: parallelWorkflowInputSchema,
  outputSchema: parallelWorkflowOutputSchema,
  stateSchema: parallelWorkflowStateSchema,
})
  .then(planStep)
  .map(async ({ inputData }) => inputData)
  .dountil(executeWaveStep, async ({ inputData }) => inputData.done === true)
  .then(synthesisStep)

parallelWorkflow.commit()
