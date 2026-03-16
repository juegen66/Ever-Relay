import { createStep } from "@mastra/inngest"

import { codingWorkerAgent } from "@/server/mastra/agents/vibecoding/coding-worker-agent"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { codingRunsService } from "@/server/modules/coding-runs/coding-runs.service"

import {
  codingReportIngestOutputSchema,
  codingSandboxExecuteOutputSchema,
} from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

export const executeCodingSandboxStep = createStep({
  id: "coding_agent_sandbox_execute",
  description: "Execute the confirmed coding report inside the E2B sandbox",
  inputSchema: codingReportIngestOutputSchema,
  outputSchema: codingSandboxExecuteOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await codingRunsService.getRunById(inputData.runId)
      const existingExecutionText =
        run?.resultJson && typeof run.resultJson.executionRaw === "string"
          ? run.resultJson.executionRaw
          : null

      if (existingExecutionText) {
        return {
          ...inputData,
          executionText: existingExecutionText,
          executionJson:
            run?.resultJson && typeof run.resultJson.execution === "object"
              ? (run.resultJson.execution as Record<string, unknown>)
              : null,
        }
      }

      await codingRunsService.markStage(inputData.runId, "generate")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
        appId: inputData.appId,
      })

      const prompt = [
        "Execute the sandbox validation phase for this coding request.",
        "Use execute_sandbox_command for safe read-only validation only.",
        "Run at most 3 commands.",
        "Return JSON only with keys: status, summary, commands, findings, nextActions.",
        `Confirmed report: ${JSON.stringify(inputData.report)}`,
        `Plan summary:\n${inputData.planText}`,
      ].join("\n\n")

      const output = await codingWorkerAgent.generate(prompt, {
        requestContext,
      })

      const executionText = output.text ?? ""
      const executionJson = parseJsonObject(executionText)

      await codingRunsService.updateRun(inputData.runId, {
        stage: "generate",
        status: "running",
        resultJson: {
          report: inputData.report,
          planText: inputData.planText,
          executionRaw: executionText,
          execution: executionJson,
        },
      })

      return {
        ...inputData,
        executionText,
        executionJson,
      }
    } catch (error) {
      await codingRunsService.markFailed(inputData.runId, errorToMessage(error))
      throw error
    }
  },
})
