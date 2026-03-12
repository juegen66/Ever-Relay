import { createStep } from "@mastra/inngest"

import { brandBriefAgent } from "@/server/mastra/agents/brand-brief-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import {
  canvasDesignPhilosophyBlock,
  canvasDesignReferenceBlock,
} from "@/server/mastra/prompts/logo-workflow-prompt"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"

import {
  logoDesignBriefOutputSchema,
  logoDesignWorkflowInputSchema,
} from "./schemas"
import { errorToMessage } from "./utils"

const BRAND_CONTEXT_HEADER = "## Brand Context"

function cleanMarkdownText(rawText: string) {
  const text = rawText.trim()
  if (!text) {
    return null
  }

  const cleaned = text
    .replace(/^\s*```(?:markdown|md)?/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  return cleaned || null
}

function normalizeDesignPhilosophyMarkdown(rawText: string) {
  const cleaned = cleanMarkdownText(rawText)
  if (!cleaned) {
    return null
  }

  return cleaned.replace(/^##\s*Design Philosophy\s*/i, "").trim() || null
}

function buildPlanningPrompt(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "You are in step 1 of a canvas-first logo workflow.",
    "Task: produce markdown only with one concise factual brand context section and one canonical design philosophy section.",
    "The design philosophy is the primary creative artifact. The brand context is supporting factual grounding only.",
    "Preserve the canvas-design wording and method as much as possible.",
    "Output plain markdown only. No JSON. No code fences. No XML/SVG.",
    "Required structure:",
    "## Brand Context",
    "- 3-6 concise bullets covering brand name, primary request, audience/positioning, design constraints, and any avoids when known",
    "## Design Philosophy",
    "- 4-6 substantial paragraphs in prose only",
    "- visual-first, minimal text, craftsmanship emphasis",
    "Canonical canvas-design philosophy source text (keep wording and method whenever possible):",
    canvasDesignPhilosophyBlock,
    "Associated subtle-reference guidance from canvas-design:",
    canvasDesignReferenceBlock,
    `User prompt: ${inputData.prompt}`,
  ]

  if (inputData.brandBrief) {
    parts.push(`Structured brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }

  return parts.join("\n\n")
}

function createFallbackBrandContextMarkdown(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
}) {
  const brandName =
    typeof inputData.brandBrief?.brandName === "string" &&
    inputData.brandBrief.brandName.trim()
      ? inputData.brandBrief.brandName.trim()
      : "Untitled Brand"

  return [
    BRAND_CONTEXT_HEADER,
    `- Brand: ${brandName}`,
    `- Primary request: ${inputData.prompt}`,
    "- Core ask: create one coherent logo system and poster language from a canvas-first design philosophy.",
    "- Constraints: vector-native, scalable, minimal text, strong silhouette recognition.",
    "- Avoid: decorative clutter, fragile details, and generic stock-brand cues.",
  ].join("\n")
}

function createFallbackDesignPhilosophyMarkdown(inputData: {
  brandBrief?: Record<string, unknown>
}) {
  const brandName =
    typeof inputData.brandBrief?.brandName === "string" &&
    inputData.brandBrief.brandName.trim()
      ? inputData.brandBrief.brandName.trim()
      : "Untitled Brand"

  return [
    `The ${brandName} identity should behave like a disciplined visual movement, where form, proportion, and silhouette carry meaning before explanation appears. Geometry must feel inevitable rather than decorative, with each contour reading as the result of careful refinement and deep authorship rather than stylistic noise.`,
    "Color should function as structure rather than ornament, creating hierarchy through calibrated contrast and restraint. The palette must feel deliberately tuned, as though every tonal relationship has been patiently tested to produce a sharp but quiet confidence that can survive across icon, lockup, and poster scale.",
    "Spatial communication is central to the system. Negative space should operate as active material, framing the mark, sharpening recognition, and allowing the identity to breathe without losing tension. The result should suggest a subtle conceptual thread embedded inside the work, legible to insiders without becoming literal or over-explained.",
    "Typography remains minimal and architectural, present only when it intensifies the mark rather than competing with it. Every alignment, interval, and proportion should feel meticulously crafted, the product of painstaking attention by someone at the top of their field, so the finished work reads as pristine, controlled, and unmistakably expert.",
  ].join("\n\n")
}

function normalizePlanningMarkdown(
  rawText: string,
  inputData: { prompt: string; brandBrief?: Record<string, unknown> }
) {
  const cleaned = cleanMarkdownText(rawText)
  if (!cleaned) {
    return null
  }

  const brandContextMatch = /^##\s*Brand Context\b/im.exec(cleaned)
  const designPhilosophyMatch = /^##\s*Design Philosophy\b/im.exec(cleaned)

  const philosophyMarkdown =
    designPhilosophyMatch?.index !== undefined
      ? normalizeDesignPhilosophyMarkdown(cleaned.slice(designPhilosophyMatch.index))
      : normalizeDesignPhilosophyMarkdown(cleaned)

  if (!philosophyMarkdown) {
    return null
  }

  const brandContextMarkdown =
    brandContextMatch?.index !== undefined
      ? cleaned
          .slice(
            brandContextMatch.index,
            designPhilosophyMatch?.index ?? cleaned.length
          )
          .trim()
      : createFallbackBrandContextMarkdown(inputData)

  return {
    logoBriefMarkdown: brandContextMarkdown,
    designPhilosophyMarkdown: philosophyMarkdown,
  }
}

export const planLogoStep = createStep({
  id: "logo_design_plan",
  description: "Create brand context markdown and canonical design philosophy in-memory",
  inputSchema: logoDesignWorkflowInputSchema,
  outputSchema: logoDesignBriefOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingPlan = run?.planJson as
        | {
            logoBriefMarkdown?: string
            designPhilosophyMarkdown?: string
          }
        | null

      const existingBrief = cleanMarkdownText(
        typeof existingPlan?.logoBriefMarkdown === "string"
          ? existingPlan.logoBriefMarkdown
          : ""
      )
      const existingPhilosophy = normalizeDesignPhilosophyMarkdown(
        typeof existingPlan?.designPhilosophyMarkdown === "string"
          ? existingPlan.designPhilosophyMarkdown
          : ""
      )

      if (existingPhilosophy) {
        return {
          runId: inputData.runId,
          userId: inputData.userId,
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief,
          logoBriefMarkdown:
            existingBrief ??
            createFallbackBrandContextMarkdown({
              prompt: inputData.prompt,
              brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
            }),
          designPhilosophyMarkdown: existingPhilosophy,
        }
      }

      await logoDesignService.markStage(inputData.runId, "planning")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      let planningOutput:
        | {
            logoBriefMarkdown: string
            designPhilosophyMarkdown: string
          }
        | null = null

      try {
        const output = await brandBriefAgent.generate(
          buildPlanningPrompt({
            prompt: inputData.prompt,
            brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
          }),
          {
            requestContext,
            toolChoice: "none",
          }
        )
        planningOutput = normalizePlanningMarkdown(output.text ?? "", {
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        })
      } catch {
        planningOutput = null
      }

      const finalBrief =
        planningOutput?.logoBriefMarkdown ??
        createFallbackBrandContextMarkdown({
          prompt: inputData.prompt,
          brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        })

      const finalDesignPhilosophy =
        planningOutput?.designPhilosophyMarkdown ??
        createFallbackDesignPhilosophyMarkdown({
          brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        })

      await logoDesignService.updateRun(inputData.runId, {
        stage: "planning",
        status: "running",
        planJson: {
          logoBriefMarkdown: finalBrief,
          designPhilosophyMarkdown: finalDesignPhilosophy,
        },
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        prompt: inputData.prompt,
        brandBrief: inputData.brandBrief,
        logoBriefMarkdown: finalBrief,
        designPhilosophyMarkdown: finalDesignPhilosophy,
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
