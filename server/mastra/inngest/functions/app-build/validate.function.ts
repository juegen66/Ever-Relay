import { createStep } from "@mastra/inngest"
import { reviewerAgent } from "@/server/mastra/agents/vibecoding/reviewer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import {
  APP_BUILD_COMPLETED_EVENT,
  APP_BUILD_FAILED_EVENT,
} from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { buildsService } from "@/server/modules/builds/builds.service"
import { buildGenerateOutputSchema, buildValidateOutputSchema } from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const validateBuildStep = createStep({
  id: "app_build_validate",
  description: "Review generated result and decide pass/fail",
  inputSchema: buildGenerateOutputSchema,
  outputSchema: buildValidateOutputSchema,
  execute: async ({ inputData }) => {
    try {
      await buildsService.markStage(inputData.runId, "validate")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
        projectId: inputData.projectId ?? null,
      })

      const prompt = [
        "Review the build result and return JSON only.",
        "Required keys: verdict (pass|fail), feedback, findings.",
        `Original prompt: ${inputData.prompt}`,
        `Plan:\n${inputData.planText}`,
        `Build output:\n${inputData.buildText}`,
      ].join("\n\n")

      const output = await reviewerAgent.generate(prompt, {
        requestContext,
      })

      const reviewText = output.text ?? ""
      const reviewJson = parseJsonObject(reviewText)
      const verdict = reviewJson?.verdict === "fail" ? "fail" : "pass"

      const result = {
        runId: inputData.runId,
        userId: inputData.userId,
        projectId: inputData.projectId ?? null,
        prompt: inputData.prompt,
        planText: inputData.planText,
        buildText: inputData.buildText,
        verdict,
        reviewText,
        reviewJson,
      } as const

      if (verdict === "fail") {
        const errorMessage = reviewJson?.feedback
        const normalizedMessage =
          typeof errorMessage === "string" && errorMessage.trim()
            ? errorMessage
            : "Build validation failed"
        throw new Error(normalizedMessage)
      }

      await buildsService.markCompleted(inputData.runId, {
        planText: inputData.planText,
        buildText: inputData.buildText,
        review: reviewJson,
      })

      await inngest.send({
        name: APP_BUILD_COMPLETED_EVENT,
        data: {
          runId: inputData.runId,
          userId: inputData.userId,
          summary:
            typeof reviewJson?.feedback === "string"
              ? reviewJson.feedback
              : "Build completed",
        },
      })

      return result
    } catch (error) {
      const message = errorToMessage(error)
      await buildsService.markFailed(inputData.runId, message)
      await inngest.send({
        name: APP_BUILD_FAILED_EVENT,
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
