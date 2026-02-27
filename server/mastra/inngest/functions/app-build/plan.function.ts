import { createStep } from "@mastra/inngest"
import { plannerAgent } from "@/server/mastra/agents/planner-agent"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { buildsService } from "@/server/modules/builds/builds.service"
import {
  buildPlanOutputSchema,
  buildWorkflowInputSchema,
} from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const planBuildStep = createStep({
  id: "app_build_plan",
  description: "Create an execution plan for the build request",
  inputSchema: buildWorkflowInputSchema,
  outputSchema: buildPlanOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await buildsService.getRunById(inputData.runId)
      const existingPlan = run?.planJson
      const existingPlanText =
        existingPlan && typeof existingPlan.raw === "string"
          ? existingPlan.raw
          : null

      if (existingPlanText) {
        return {
          runId: inputData.runId,
          userId: inputData.userId,
          projectId: inputData.projectId ?? null,
          prompt: inputData.prompt,
          planText: existingPlanText,
          planJson:
            existingPlan && typeof existingPlan.plan === "object" && existingPlan.plan
              ? (existingPlan.plan as Record<string, unknown>)
              : null,
        }
      }

      await buildsService.markStage(inputData.runId, "plan")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
        projectId: inputData.projectId ?? null,
      })

      const prompt = [
        "Create a compact JSON build plan.",
        "Output JSON object only with keys: goal, assumptions, steps, risks.",
        `User prompt: ${inputData.prompt}`,
      ].join("\n")

      const output = await plannerAgent.generate(prompt, {
        requestContext,
      })

      const planText = output.text ?? ""
      const planJson = parseJsonObject(planText)

      await buildsService.updateRun(inputData.runId, {
        stage: "plan",
        status: "running",
        planJson: {
          raw: planText,
          plan: planJson,
        },
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        projectId: inputData.projectId ?? null,
        prompt: inputData.prompt,
        planText,
        planJson,
      }
    } catch (error) {
      await buildsService.markFailed(inputData.runId, errorToMessage(error))
      throw error
    }
  },
})

