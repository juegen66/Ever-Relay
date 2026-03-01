import { createStep } from "@mastra/inngest"
import { brandDesignerAgent } from "@/server/mastra/agents/brand-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignBrandOutputSchema,
  logoDesignPlanOutputSchema,
} from "./schemas"
import {
  buildPlanContext,
  createFallbackBrandOutput,
  errorToMessage,
  normalizeBrandOutput,
  parseJsonObject,
} from "./utils"

type RunRequestContext = ReturnType<typeof createBuildRunRequestContext>

function buildBrandDesignPrompt(inputData: {
  prompt: string
  planContext: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "Create exactly ONE cohesive brand logo system.",
    "Return JSON only. Do not wrap in markdown.",
    "Output shape:",
    JSON.stringify({
      conceptName: "string",
      rationaleMd: "string",
      logoSvg: { full: "<svg...>", icon: "<svg...>", wordmark: "<svg...>" },
      colorPalette: { primary: "#000000", secondary: "#111111", neutral: "#f5f5f5" },
      typography: { headingFont: "string", bodyFont: "string" },
      brandGuidelines: "string",
    }),
    "Constraints:",
    "- logoSvg.full, logoSvg.icon, and logoSvg.wordmark must each be complete valid SVG strings",
    "- all three SVG outputs must be visually coherent as one logo system",
    "- do not output planning keys like goal, assumptions, brandPositioning, or logoSystemDirection",
    `Original prompt: ${inputData.prompt}`,
    `Design plan context: ${inputData.planContext}`,
  ]
  if (inputData.brandBrief) {
    parts.push(`Brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }
  return parts.join("\n\n")
}

function buildBrandRepairPrompt(inputData: {
  prompt: string
  planContext: string
  brandBrief?: Record<string, unknown>
  invalidOutput: string
}) {
  const parts = [
    "Your previous answer was invalid for the required schema.",
    "Return JSON only. No markdown, no <think>, no explanation.",
    "Required JSON shape:",
    JSON.stringify({
      conceptName: "string",
      rationaleMd: "string",
      logoSvg: { full: "<svg...>", icon: "<svg...>", wordmark: "<svg...>" },
      colorPalette: { primary: "#000000", secondary: "#111111", neutral: "#f5f5f5" },
      typography: { headingFont: "string", bodyFont: "string" },
      brandGuidelines: "string",
    }),
    "Hard constraints:",
    "- logoSvg.full/icon/wordmark must be complete SVG markup strings containing <svg>...</svg>",
    "- output exactly one object (not array)",
    "- do not output plan keys (goal, assumptions, brandPositioning, logoSystemDirection)",
    `Original prompt: ${inputData.prompt}`,
    `Design plan context: ${inputData.planContext}`,
    inputData.brandBrief ? `Brand brief: ${JSON.stringify(inputData.brandBrief)}` : "",
    `Previous invalid output to fix: ${inputData.invalidOutput}`,
  ]

  return parts.filter(Boolean).join("\n\n")
}

function tryNormalizeBrandOutput(outputText: string) {
  if (!outputText.trim()) {
    return null
  }

  const parsed = parseJsonObject(outputText)
  if (!parsed) {
    return null
  }

  try {
    return normalizeBrandOutput(parsed)
  } catch {
    return null
  }
}

async function generateBrandOutputWithRecovery(inputData: {
  prompt: string
  planContext: string
  brandBrief?: Record<string, unknown>
  requestContext: RunRequestContext
}) {
  let initialText = ""

  try {
    const output = await brandDesignerAgent.generate(
      buildBrandDesignPrompt({
        prompt: inputData.prompt,
        planContext: inputData.planContext,
        brandBrief: inputData.brandBrief,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )
    initialText = output.text ?? ""

    const normalized = tryNormalizeBrandOutput(initialText)
    if (normalized) {
      return normalized
    }
  } catch {
    // Fall through to repair/fallback path.
  }

  if (initialText.trim()) {
    try {
      const repaired = await brandDesignerAgent.generate(
        buildBrandRepairPrompt({
          prompt: inputData.prompt,
          planContext: inputData.planContext,
          brandBrief: inputData.brandBrief,
          invalidOutput: initialText.slice(0, 8000),
        }),
        {
          requestContext: inputData.requestContext,
          toolChoice: "none",
        }
      )

      const repairedText = repaired.text ?? ""
      const normalized = tryNormalizeBrandOutput(repairedText)
      if (normalized) {
        return normalized
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  return createFallbackBrandOutput({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
  })
}

export const brandDesignStep = createStep({
  id: "logo_brand_design",
  description: "Generate logo SVG, color palette, typography, and brand guidelines",
  inputSchema: logoDesignPlanOutputSchema,
  outputSchema: logoDesignBrandOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingResult = run?.resultJson as
        | { brand?: Record<string, unknown> }
        | null
      const existingBrand = existingResult?.brand

      if (existingBrand && typeof existingBrand === "object") {
        const normalizedExisting =
          (() => {
            try {
              return normalizeBrandOutput(existingBrand)
            } catch {
              return createFallbackBrandOutput({
                prompt: inputData.prompt,
                brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
              })
            }
          })()
        return {
          ...inputData,
          brandOutput: normalizedExisting,
        }
      }

      await logoDesignService.markStage(inputData.runId, "brand_designing")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      const planContext = buildPlanContext(inputData.planText, inputData.planJson)
      const brandBrief = inputData.brandBrief as Record<string, unknown> | undefined

      const brandOutput = await generateBrandOutputWithRecovery({
        prompt: inputData.prompt,
        planContext,
        brandBrief,
        requestContext,
      })

      await logoDesignService.updateRun(inputData.runId, {
        stage: "brand_designing",
        status: "running",
        resultJson: { brand: brandOutput },
      })

      return {
        ...inputData,
        brandOutput,
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
