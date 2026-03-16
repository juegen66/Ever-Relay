import { createStep } from "@mastra/inngest"

import { codingRunsService } from "@/server/modules/coding-runs/coding-runs.service"

import {
  codingReportIngestOutputSchema,
  codingWorkflowInputSchema,
} from "./schemas"
import { errorToMessage } from "./utils"

function buildPlanText(input: {
  report: {
    goal: string
    currentState: string
    clarifications: string[]
    implementationPlan: string[]
    constraints: string[]
    acceptanceCriteria: string[]
    sandboxTask: string
  }
}) {
  return [
    `Goal: ${input.report.goal}`,
    `Current state: ${input.report.currentState}`,
    input.report.clarifications.length > 0
      ? `Clarifications: ${input.report.clarifications.join(" | ")}`
      : "Clarifications: none",
    `Implementation plan: ${input.report.implementationPlan.join(" | ")}`,
    input.report.constraints.length > 0
      ? `Constraints: ${input.report.constraints.join(" | ")}`
      : "Constraints: none",
    `Acceptance criteria: ${input.report.acceptanceCriteria.join(" | ")}`,
    `Sandbox task: ${input.report.sandboxTask}`,
  ].join("\n")
}

export const ingestCodingReportStep = createStep({
  id: "coding_agent_report_ingest",
  description: "Persist the confirmed coding report before sandbox execution",
  inputSchema: codingWorkflowInputSchema,
  outputSchema: codingReportIngestOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await codingRunsService.getRunById(inputData.runId)
      const existingPlanText =
        run?.planJson && typeof run.planJson.planText === "string"
          ? run.planJson.planText
          : null

      if (existingPlanText) {
        return {
          runId: inputData.runId,
          userId: inputData.userId,
          appId: inputData.appId,
          report: inputData.report,
          planText: existingPlanText,
        }
      }

      await codingRunsService.markStage(inputData.runId, "plan")
      const planText = buildPlanText(inputData)

      await codingRunsService.updateRun(inputData.runId, {
        stage: "plan",
        status: "running",
        planJson: {
          planText,
          report: inputData.report,
        },
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        appId: inputData.appId,
        report: inputData.report,
        planText,
      }
    } catch (error) {
      await codingRunsService.markFailed(inputData.runId, errorToMessage(error))
      throw error
    }
  },
})
