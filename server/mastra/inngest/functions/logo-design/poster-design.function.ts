import { createStep } from "@mastra/inngest"

import { posterDesignerAgent } from "@/server/mastra/agents/logo-studio/poster-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"

import {
  logoDesignFinalOutputSchema,
  logoDesignPhilosophyOutputSchema,
  logoPosterOutputSchema,
  type LogoPosterOutput,
} from "./schemas"
import {
  createFallbackPosterOutput,
  errorToMessage,
  normalizePosterOutput,
  parseJsonObject,
} from "./utils"

type RunRequestContext = ReturnType<typeof createBuildRunRequestContext>

function buildPosterPrompt(inputData: {
  prompt: string
  selectedConceptName: string
  selectedLogoSvg: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
}) {
  return [
    "You are in step 4 of a strict logo workflow.",
    "Task: generate exactly one poster SVG from the selected logo and design philosophy.",
    "Output JSON only. No markdown. No code fences.",
    "JSON shape:",
    JSON.stringify({
      posterSvg: "<svg...></svg>",
      rationaleMd: "string",
    }),
    "Hard rules:",
    "- posterSvg must be complete and valid SVG",
    "- poster must visually align with selected logo and philosophy",
    "- keep typography minimal and composition clean",
    `Original prompt: ${inputData.prompt}`,
    `Selected concept: ${inputData.selectedConceptName}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
    `Selected logo SVG:\n${inputData.selectedLogoSvg}`,
  ].join("\n\n")
}

function buildPosterRepairPrompt(inputData: {
  prompt: string
  selectedConceptName: string
  selectedLogoSvg: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  invalidOutput: string
}) {
  return [
    "Your previous poster response was invalid.",
    "Return JSON only. No markdown. No code fences.",
    "Required JSON shape:",
    JSON.stringify({
      posterSvg: "<svg...></svg>",
      rationaleMd: "string",
    }),
    "posterSvg must be complete SVG markup with <svg>...</svg>",
    `Original prompt: ${inputData.prompt}`,
    `Selected concept: ${inputData.selectedConceptName}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
    `Selected logo SVG:\n${inputData.selectedLogoSvg}`,
    `Invalid output to repair: ${inputData.invalidOutput}`,
  ].join("\n\n")
}

function tryNormalizePosterOutput(text: string) {
  if (!text.trim()) {
    return null
  }

  const parsed = parseJsonObject(text)
  if (!parsed) {
    return null
  }

  const normalized = normalizePosterOutput(parsed)
  const withRationale = logoPosterOutputSchema.parse({
    ...normalized,
    rationaleMd:
      normalized.rationaleMd ??
      "Poster translated from selected logo concept and philosophy.",
  })
  return withRationale
}

async function generatePosterWithRecovery(inputData: {
  prompt: string
  selectedConceptName: string
  selectedLogoSvg: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  brandBrief?: Record<string, unknown>
  requestContext: RunRequestContext
  fallback: () => LogoPosterOutput
}) {
  let initialText = ""

  try {
    const output = await posterDesignerAgent.generate(
      buildPosterPrompt({
        prompt: inputData.prompt,
        selectedConceptName: inputData.selectedConceptName,
        selectedLogoSvg: inputData.selectedLogoSvg,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
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
          selectedConceptName: inputData.selectedConceptName,
          selectedLogoSvg: inputData.selectedLogoSvg,
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
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

  return inputData.fallback()
}

export const posterDesignStep = createStep({
  id: "logo_poster_design",
  description: "Generate poster SVG (in-memory) and finalize run",
  inputSchema: logoDesignPhilosophyOutputSchema,
  outputSchema: logoDesignFinalOutputSchema,
  execute: async ({ inputData }) => {
    try {
      await logoDesignService.markStage(inputData.runId, "poster_designing")

      const selectedConcept =
        inputData.logoConcepts.find(
          (concept) => concept.id === inputData.selectedConceptId
        ) ?? inputData.logoConcepts[0]

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      const posterOutput = await generatePosterWithRecovery({
        prompt: inputData.prompt,
        selectedConceptName: selectedConcept.conceptName,
        selectedLogoSvg: selectedConcept.logoSvg,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        requestContext,
        fallback: () =>
          createFallbackPosterOutput({
            prompt: inputData.prompt,
            brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
            brandOutput: inputData.brandOutput,
          }),
      })

      const finalPosterOutput = {
        ...posterOutput,
        philosophyMd: inputData.designPhilosophyMarkdown,
      }

      await logoDesignService.markCompleted(inputData.runId, {
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        logoConcepts: inputData.logoConcepts,
        selectedConceptId: selectedConcept.id,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        brand: {
          ...inputData.brandOutput,
          logoConcepts: inputData.logoConcepts,
          selectedConceptId: selectedConcept.id,
        },
        poster: finalPosterOutput,
        inMemoryArtifacts: {
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          logoConcepts: inputData.logoConcepts,
          designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
          posterSvgCode: finalPosterOutput.posterSvg,
        },
      })

      return {
        ...inputData,
        selectedConceptId: selectedConcept.id,
        posterOutput: finalPosterOutput,
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
