import { createStep } from "@mastra/inngest"
import { plannerAgent } from "@/server/mastra/agents/planner-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignPlanOutputSchema,
  logoDesignWorkflowInputSchema,
} from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const planLogoStep = createStep({
  id: "logo_design_plan",
  description: "Create a brand strategy plan for the logo design request",
  inputSchema: logoDesignWorkflowInputSchema,
  outputSchema: logoDesignPlanOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingPlan = run?.planJson as
        | { raw?: string; plan?: Record<string, unknown> }
        | null
      const existingPlanText =
        existingPlan && typeof existingPlan.raw === "string"
          ? existingPlan.raw
          : null

      if (existingPlanText) {
        return {
          runId: inputData.runId,
          userId: inputData.userId,
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief,
          planText: existingPlanText,
          planJson:
            existingPlan &&
            typeof existingPlan.plan === "object" &&
            existingPlan.plan
              ? (existingPlan.plan as Record<string, unknown>)
              : null,
        }
      }

      await logoDesignService.markStage(inputData.runId, "planning")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      const prompt = [
        "Create a compact JSON brand strategy plan for a single cohesive logo system.",
        "Output JSON object only with keys: goal, brandPositioning, targetEmotion, colorDirection, typographyDirection, logoSystemDirection, assumptions.",
        "Keep the plan concise and actionable for generating one final logo system (full + icon + wordmark).",
        `User prompt: ${inputData.prompt}`,
        inputData.brandBrief
          ? `Brand brief context: ${JSON.stringify(inputData.brandBrief)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")

      const output = await plannerAgent.generate(prompt, {
        requestContext,
        toolChoice: "none",
      })

      const planText = output.text ?? ""
      const planJson = parseJsonObject(planText)

      await logoDesignService.updateRun(inputData.runId, {
        stage: "planning",
        status: "running",
        planJson: {
          raw: planText,
          plan: planJson,
        },
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        prompt: inputData.prompt,
        brandBrief: inputData.brandBrief,
        planText,
        planJson,
      }
    } catch (error) {
      const message = errorToMessage(error)
      await logoDesignService.markFailed(inputData.runId, message)
      await inngest.send({
        name: LOGO_DESIGN_FAILED_EVENT,
        data: { runId: inputData.runId, userId: inputData.userId, error: message },
      })
      throw error
    }
  },
})
