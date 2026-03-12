import { createStep } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"

import {
  logoDesignConceptOutputSchema,
  logoDesignPhilosophyOutputSchema,
} from "./schemas"
import { errorToMessage } from "./utils"

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function normalizePhilosophyMarkdown(text: string) {
  const cleaned = text
    .replace(/^\s*```(?:markdown|md|json)?/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^##\s*Design Philosophy\s*/i, "")
    .trim()

  return cleaned || null
}

function createFallbackPhilosophyMarkdown(inputData: {
  brandName: string
}) {
  return [
    `The ${inputData.brandName} identity treats visual form as a study of force, where proportion and silhouette carry meaning before explanation appears. Shapes should feel resolved at first glance and remain coherent under close inspection, with every curve and angle placed through meticulous craft rather than decorative impulse.`,
    "Color behaves as structural emphasis, not ornament. A restrained palette anchors recognition while selective contrast creates hierarchy and rhythm. Surfaces should read as intentionally calibrated, with transitions and balances refined through painstaking attention to detail so the composition feels deliberate in every viewing context.",
    "Spatial composition must prioritize breathing room and tension in equal measure. Negative space is used as an active material to frame the mark, guide attention, and preserve legibility across scales. The work should look patiently tuned, as if each alignment were revised repeatedly by a specialist pursuing master-level clarity.",
    "Typography remains minimal and architectural, supporting the mark without competing with it. Text appears only where it sharpens meaning, integrated into the visual system with disciplined scale and cadence. The overall artifact should communicate deep expertise and labor-intensive precision, presenting a polished, museum-grade standard of execution.",
  ].join("\n\n")
}

export const philosophyStep = createStep({
  id: "logo_design_philosophy",
  description: "Persist the canonical design philosophy before poster generation",
  inputSchema: logoDesignConceptOutputSchema,
  outputSchema: logoDesignPhilosophyOutputSchema,
  execute: async ({ inputData }) => {
    try {
      await logoDesignService.markStage(inputData.runId, "poster_designing")

      const selectedConcept =
        inputData.logoConcepts.find(
          (concept) => concept.id === inputData.selectedConceptId
        ) ?? inputData.logoConcepts[0]
      const brandName =
        asString(inputData.brandBrief?.brandName) ?? "Untitled Brand"
      const finalPhilosophy =
        normalizePhilosophyMarkdown(inputData.designPhilosophyMarkdown) ??
        createFallbackPhilosophyMarkdown({
          brandName,
        })

      const run = await logoDesignService.getRunById(inputData.runId)
      const existingResult = asRecord(run?.resultJson)

      await logoDesignService.updateRun(inputData.runId, {
        stage: "poster_designing",
        status: "running",
        resultJson: {
          ...(existingResult ?? {}),
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          logoConcepts: inputData.logoConcepts,
          selectedConceptId: selectedConcept.id,
          brand: {
            ...inputData.brandOutput,
            logoConcepts: inputData.logoConcepts,
            selectedConceptId: selectedConcept.id,
          },
          designPhilosophyMarkdown: finalPhilosophy,
        },
      })

      return {
        ...inputData,
        selectedConceptId: selectedConcept.id,
        designPhilosophyMarkdown: finalPhilosophy,
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
