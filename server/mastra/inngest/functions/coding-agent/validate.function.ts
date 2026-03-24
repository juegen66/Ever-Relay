import { createStep } from "@mastra/inngest"

import { codingReviewerAgent } from "@/server/mastra/agents/vibecoding/coding-reviewer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import {
  CODING_AGENT_COMPLETED_EVENT,
  CODING_AGENT_FAILED_EVENT,
} from "@/server/mastra/inngest/events"
import { codingRunsService } from "@/server/modules/coding-runs/coding-runs.service"

import {
  codingSandboxExecuteOutputSchema,
  codingValidateOutputSchema,
} from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const validateCodingRunStep = createStep({
  id: "coding_agent_validate",
  description: "Validate the sandbox result for the coding workflow",
  inputSchema: codingSandboxExecuteOutputSchema,
  outputSchema: codingValidateOutputSchema,
  execute: async ({ inputData }) => {
    try {
      await codingRunsService.markStage(inputData.runId, "validate")

      const prompt = [
        "Review this EverRelay coding workflow result and return JSON only.",
        "Required keys: verdict (pass|fail), feedback, findings, nextStep.",
        `Confirmed report: ${JSON.stringify(inputData.report)}`,
        `Plan summary:\n${inputData.planText}`,
        `Sandbox execution output:\n${inputData.executionText}`,
      ].join("\n\n")

      const output = await codingReviewerAgent.generate(prompt)
      const reviewText = output.text ?? ""
      const reviewJson = parseJsonObject(reviewText)
      const verdict = reviewJson?.verdict === "fail" ? "fail" : "pass"

      const result = {
        runId: inputData.runId,
        userId: inputData.userId,
        appId: inputData.appId,
        report: inputData.report,
        planText: inputData.planText,
        executionText: inputData.executionText,
        verdict,
        reviewText,
        reviewJson,
      } as const

      if (verdict === "fail") {
        const message =
          typeof reviewJson?.feedback === "string" && reviewJson.feedback.trim()
            ? reviewJson.feedback
            : "Coding workflow validation failed"
        throw new Error(message)
      }

      await codingRunsService.markCompleted(inputData.runId, {
        report: inputData.report,
        planText: inputData.planText,
        executionRaw: inputData.executionText,
        execution: inputData.executionJson,
        reviewRaw: reviewText,
        review: reviewJson,
      })

      await inngest.send({
        name: CODING_AGENT_COMPLETED_EVENT,
        data: {
          runId: inputData.runId,
          userId: inputData.userId,
          summary:
            typeof reviewJson?.feedback === "string"
              ? reviewJson.feedback
              : "Coding workflow completed",
        },
      })

      return result
    } catch (error) {
      const message = errorToMessage(error)
      await codingRunsService.markFailed(inputData.runId, message)
      await inngest.send({
        name: CODING_AGENT_FAILED_EVENT,
        data: {
          runId: inputData.runId,
          userId: inputData.userId,
          error: message,
        },
      })
      throw error
    }
  },
})
