import { createStep } from "@mastra/inngest"
import { posterDesignerAgent } from "@/server/mastra/agents/poster-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignBrandOutputSchema,
  logoDesignPosterOutputSchema,
  type LogoBrandOutput,
} from "./schemas"
import {
  buildPlanContext,
  createFallbackPosterOutput,
  errorToMessage,
  normalizePosterOutput,
  parseJsonObject,
} from "./utils"

type RunRequestContext = ReturnType<typeof createBuildRunRequestContext>

function buildPosterDesignPrompt(inputData: {
  prompt: string
  planContext: string
  brandOutput: LogoBrandOutput
}) {
  const parts = [
    "Create exactly ONE poster based on the provided single logo system.",
    "Return JSON only. Do not wrap in markdown.",
    "Output shape:",
    JSON.stringify({
      posterSvg: "<svg...>",
      rationaleMd: "string",
      philosophyMd: "string",
    }),
    "Constraints:",
    "- each posterSvg must be a complete valid SVG string",
    "- poster visual language must align with the provided logo system",
    `Original prompt: ${inputData.prompt}`,
    `Design plan context: ${inputData.planContext}`,
    `Brand output summary: ${JSON.stringify(inputData.brandOutput, null, 2)}`,
  ]
  return parts.join("\n\n")
}

function buildPosterRepairPrompt(inputData: {
  prompt: string
  planContext: string
  brandOutput: LogoBrandOutput
  invalidOutput: string
}) {
  const parts = [
    "Your previous poster response was invalid.",
    "Return JSON only. No markdown, no <think>, no explanation.",
    "Required JSON shape:",
    JSON.stringify({
      posterSvg: "<svg...>",
      rationaleMd: "string",
      philosophyMd: "string",
    }),
    "Hard constraints:",
    "- posterSvg must contain complete SVG markup with <svg>...</svg>",
    "- output exactly one object (not array)",
    `Original prompt: ${inputData.prompt}`,
    `Design plan context: ${inputData.planContext}`,
    `Brand output summary: ${JSON.stringify(inputData.brandOutput, null, 2)}`,
    `Previous invalid output to fix: ${inputData.invalidOutput}`,
  ]
  return parts.join("\n\n")
}

function tryNormalizePosterOutput(outputText: string) {
  if (!outputText.trim()) {
    return null
  }

  const parsed = parseJsonObject(outputText)
  if (!parsed) {
    return null
  }

  try {
    return normalizePosterOutput(parsed)
  } catch {
    return null
  }
}

async function generatePosterOutputWithRecovery(inputData: {
  prompt: string
  planContext: string
  brandBrief?: Record<string, unknown>
  brandOutput: LogoBrandOutput
  requestContext: RunRequestContext
}) {
  let initialText = ""

  try {
    const output = await posterDesignerAgent.generate(
      buildPosterDesignPrompt({
        prompt: inputData.prompt,
        planContext: inputData.planContext,
        brandOutput: inputData.brandOutput,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )
    initialText = output.text ?? ""

    const normalized = tryNormalizePosterOutput(initialText)
    if (normalized) {
      return normalized
    }
  } catch {
    // Fall through to repair/fallback path.
  }

  if (initialText.trim()) {
    try {
      const repaired = await posterDesignerAgent.generate(
        buildPosterRepairPrompt({
          prompt: inputData.prompt,
          planContext: inputData.planContext,
          brandOutput: inputData.brandOutput,
          invalidOutput: initialText.slice(0, 8000),
        }),
        {
          requestContext: inputData.requestContext,
          toolChoice: "none",
        }
      )

      const repairedText = repaired.text ?? ""
      const normalized = tryNormalizePosterOutput(repairedText)
      if (normalized) {
        return normalized
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  return createFallbackPosterOutput({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
    brandOutput: inputData.brandOutput,
  })
}

export const posterDesignStep = createStep({
  id: "logo_poster_design",
  description: "Generate design philosophy and poster SVG",
  inputSchema: logoDesignBrandOutputSchema,
  outputSchema: logoDesignPosterOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingResult = run?.resultJson as
        | { brand?: unknown; poster?: Record<string, unknown> }
        | null
      const existingPoster = existingResult?.poster

      if (existingPoster && typeof existingPoster === "object") {
        const normalizedExisting =
          (() => {
            try {
              return normalizePosterOutput(existingPoster)
            } catch {
              return createFallbackPosterOutput({
                prompt: inputData.prompt,
                brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
                brandOutput: inputData.brandOutput,
              })
            }
          })()
        return {
          ...inputData,
          posterOutput: normalizedExisting,
        }
      }

      await logoDesignService.markStage(inputData.runId, "poster_designing")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      const planContext = buildPlanContext(inputData.planText, inputData.planJson)
      const brandBrief = inputData.brandBrief as Record<string, unknown> | undefined
      const posterOutput = await generatePosterOutputWithRecovery({
        prompt: inputData.prompt,
        planContext,
        brandBrief,
        brandOutput: inputData.brandOutput,
        requestContext,
      })

      await logoDesignService.updateRun(inputData.runId, {
        stage: "poster_designing",
        status: "running",
        resultJson: {
          brand: inputData.brandOutput,
          poster: posterOutput,
        },
      })

      return {
        ...inputData,
        posterOutput,
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
