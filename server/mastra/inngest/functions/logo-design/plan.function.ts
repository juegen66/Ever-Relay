import { createStep } from "@mastra/inngest"
import { brandBriefAgent } from "@/server/mastra/agents/brand-brief-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignBriefOutputSchema,
  logoDesignWorkflowInputSchema,
} from "./schemas"
import { errorToMessage } from "./utils"

function buildBriefPrompt(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "You are in step 1 of a strict logo workflow.",
    "Task: produce a concise markdown logo brief only.",
    "Follow brand discovery structure from the brand-brief skill.",
    "Output plain markdown only. No JSON. No code fences. No XML/SVG.",
    "Required sections in markdown:",
    "1. Brand Discovery",
    "2. Audience and Positioning",
    "3. Visual Direction",
    "4. Logo Constraints",
    "5. Evaluation Criteria",
    "Keep it practical for generating exactly 3 SVG logo concepts in the next step.",
    `User prompt: ${inputData.prompt}`,
  ]

  if (inputData.brandBrief) {
    parts.push(`Structured brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }

  return parts.join("\n\n")
}

function normalizeBriefMarkdown(rawText: string) {
  const text = rawText.trim()
  if (!text) {
    return null
  }

  const cleaned = text
    .replace(/^\s*```(?:markdown|md)?/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  if (!cleaned) {
    return null
  }

  return cleaned
}

function createFallbackBriefMarkdown(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
}) {
  const brandName =
    typeof inputData.brandBrief?.brandName === "string" &&
    inputData.brandBrief.brandName.trim()
      ? inputData.brandBrief.brandName.trim()
      : "Untitled Brand"

  return [
    "## Brand Discovery",
    `- Brand: ${brandName}`,
    `- Primary request: ${inputData.prompt}`,
    "- Core ask: create one coherent logo system and poster language.",
    "",
    "## Audience and Positioning",
    "- Audience: digital-first users in modern product contexts.",
    "- Positioning: clear, memorable, scalable, and implementation-ready.",
    "",
    "## Visual Direction",
    "- Geometry-first composition with strong silhouette recognition.",
    "- High-contrast palette with one dominant primary color.",
    "- Typographic tone: contemporary sans-serif with confident rhythm.",
    "",
    "## Logo Constraints",
    "- Must be vector-native and scalable.",
    "- Must work at small and large sizes.",
    "- Avoid decorative clutter and fragile detail.",
    "",
    "## Evaluation Criteria",
    "- Distinctiveness across 3 concept directions.",
    "- Legibility at app-icon scale.",
    "- Consistent style for downstream poster generation.",
  ].join("\n")
}

export const planLogoStep = createStep({
  id: "logo_design_plan",
  description: "Create markdown logo brief (in-memory) using brand-brief skill",
  inputSchema: logoDesignWorkflowInputSchema,
  outputSchema: logoDesignBriefOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingPlan = run?.planJson as
        | { logoBriefMarkdown?: string }
        | null
      const existingBrief = normalizeBriefMarkdown(
        typeof existingPlan?.logoBriefMarkdown === "string"
          ? existingPlan.logoBriefMarkdown
          : ""
      )

      if (existingBrief) {
        return {
          runId: inputData.runId,
          userId: inputData.userId,
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief,
          logoBriefMarkdown: existingBrief,
        }
      }

      await logoDesignService.markStage(inputData.runId, "planning")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      let logoBriefMarkdown: string | null = null

      try {
        const output = await brandBriefAgent.generate(
          buildBriefPrompt({
            prompt: inputData.prompt,
            brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
          }),
          {
            requestContext,
            toolChoice: "none",
          }
        )
        logoBriefMarkdown = normalizeBriefMarkdown(output.text ?? "")
      } catch {
        logoBriefMarkdown = null
      }

      const finalBrief =
        logoBriefMarkdown ??
        createFallbackBriefMarkdown({
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        })

      await logoDesignService.updateRun(inputData.runId, {
        stage: "planning",
        status: "running",
        planJson: {
          logoBriefMarkdown: finalBrief,
        },
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        prompt: inputData.prompt,
        brandBrief: inputData.brandBrief,
        logoBriefMarkdown: finalBrief,
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
