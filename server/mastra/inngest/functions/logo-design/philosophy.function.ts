import { createStep } from "@mastra/inngest"
import { posterDesignerAgent } from "@/server/mastra/agents/poster-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignConceptOutputSchema,
  logoDesignPhilosophyOutputSchema,
} from "./schemas"
import { errorToMessage, parseJsonObject } from "./utils"

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function stripTextElements(svg: string) {
  return svg
    .replace(/<text\b[\s\S]*?<\/text>/gi, "")
    .replace(/<tspan\b[\s\S]*?<\/tspan>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function ensureIconOnlyLogoSvg(svg: string) {
  const stripped = stripTextElements(svg)
  return stripped || svg
}

function buildPhilosophyPrompt(inputData: {
  brandName: string
  selectedConcept: {
    id: string
    conceptName: string
    rationaleMd: string
  }
  selectedLogoSvg: string
}) {
  return [
    "You are in step 3 of a strict logo workflow.",
    "Task: create design philosophy markdown only.",
    "Follow canvas-design skill's philosophy requirements: 4-6 concise paragraphs, visual-first, craftsmanship emphasis.",
    "Use only the provided brand name and one selected icon-only logo SVG (no wordmark text) as context.",
    "Output JSON only. No markdown fences. No SVG.",
    "JSON shape:",
    JSON.stringify({
      designPhilosophyMarkdown: "string",
    }),
    `Brand name: ${inputData.brandName}`,
    `Selected concept object: ${JSON.stringify(inputData.selectedConcept)}`,
    `Selected logo SVG:\n${inputData.selectedLogoSvg}`,
  ].join("\n\n")
}

function buildPhilosophyRepairPrompt(inputData: {
  brandName: string
  selectedConcept: {
    id: string
    conceptName: string
    rationaleMd: string
  }
  selectedLogoSvg: string
  invalidOutput: string
}) {
  return [
    "Your previous response was invalid.",
    "Return JSON only. No code fences.",
    "Required JSON shape:",
    JSON.stringify({
      designPhilosophyMarkdown: "string",
    }),
    "designPhilosophyMarkdown must be 4-6 paragraphs and visual-first.",
    `Brand name: ${inputData.brandName}`,
    `Selected concept object: ${JSON.stringify(inputData.selectedConcept)}`,
    `Selected logo SVG:\n${inputData.selectedLogoSvg}`,
    `Invalid output to repair: ${inputData.invalidOutput}`,
  ].join("\n\n")
}

function normalizePhilosophyMarkdown(text: string) {
  const parsed = parseJsonObject(text)
  const fromJson = asString(parsed?.designPhilosophyMarkdown)
  if (fromJson) {
    return fromJson
  }

  const cleaned = text
    .replace(/^\s*```(?:markdown|md|json)?/i, "")
    .replace(/```\s*$/i, "")
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
  description: "Generate design philosophy markdown (in-memory) using canvas-design skill",
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
      const iconOnlySelectedLogoSvg = ensureIconOnlyLogoSvg(selectedConcept.logoSvg)

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      let generatedText = ""
      let designPhilosophyMarkdown: string | null = null

      try {
        const response = await posterDesignerAgent.generate(
          buildPhilosophyPrompt({
            brandName,
            selectedConcept: {
              id: selectedConcept.id,
              conceptName: selectedConcept.conceptName,
              rationaleMd: selectedConcept.rationaleMd,
            },
            selectedLogoSvg: iconOnlySelectedLogoSvg,
          }),
          {
            requestContext,
            toolChoice: "none",
          }
        )
        generatedText = response.text ?? ""
        designPhilosophyMarkdown = normalizePhilosophyMarkdown(generatedText)
      } catch {
        designPhilosophyMarkdown = null
      }

      if (!designPhilosophyMarkdown && generatedText.trim()) {
        try {
          const repaired = await posterDesignerAgent.generate(
            buildPhilosophyRepairPrompt({
              brandName,
              selectedConcept: {
                id: selectedConcept.id,
                conceptName: selectedConcept.conceptName,
                rationaleMd: selectedConcept.rationaleMd,
              },
              selectedLogoSvg: iconOnlySelectedLogoSvg,
              invalidOutput: generatedText.slice(0, 8000),
            }),
            {
              requestContext,
              toolChoice: "none",
            }
          )
          designPhilosophyMarkdown = normalizePhilosophyMarkdown(
            repaired.text ?? ""
          )
        } catch {
          designPhilosophyMarkdown = null
        }
      }

      const finalPhilosophy =
        designPhilosophyMarkdown ??
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
