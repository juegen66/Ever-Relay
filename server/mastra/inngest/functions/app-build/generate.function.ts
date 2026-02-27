import { createStep } from "@mastra/inngest"
import { builderAgent } from "@/server/mastra/agents/builder-agent"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { buildsService } from "@/server/modules/builds/builds.service"
import { buildGenerateOutputSchema, buildPlanOutputSchema } from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const generateBuildStep = createStep({
  id: "app_build_generate",
  description: "Execute the implementation phase of the build request",
  inputSchema: buildPlanOutputSchema,
  outputSchema: buildGenerateOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await buildsService.getRunById(inputData.runId)
      const existingResult = run?.resultJson
      const existingBuildText =
        existingResult && typeof existingResult.buildRaw === "string"
          ? existingResult.buildRaw
          : null

      if (existingBuildText) {
        return {
          ...inputData,
          buildText: existingBuildText,
          buildJson:
            existingResult &&
            typeof existingResult.build === "object" &&
            existingResult.build
              ? (existingResult.build as Record<string, unknown>)
              : null,
        }
      }

      await buildsService.markStage(inputData.runId, "generate")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
        projectId: inputData.projectId ?? null,
      })

      const prompt = [
        "Execute this build plan.",
        "Return a JSON object only with keys: changes, checks, artifacts, nextActions.",
        `Original prompt: ${inputData.prompt}`,
        `Plan:\n${inputData.planText}`,
      ].join("\n\n")

      const output = await builderAgent.generate(prompt, {
        requestContext,
      })

      const buildText = output.text ?? ""
      const buildJson = parseJsonObject(buildText)

      await buildsService.updateRun(inputData.runId, {
        stage: "generate",
        status: "running",
        resultJson: {
          buildRaw: buildText,
          build: buildJson,
        },
      })

      return {
        ...inputData,
        buildText,
        buildJson,
      }
    } catch (error) {
      await buildsService.markFailed(inputData.runId, errorToMessage(error))
      throw error
    }
  },
})

