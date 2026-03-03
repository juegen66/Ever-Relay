import { createHash } from "node:crypto"
import { createStep } from "@mastra/inngest"
import { brandDesignerAgent } from "@/server/mastra/agents/brand-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignBriefOutputSchema,
  logoDesignConceptOutputSchema,
  type LogoConcept,
  type LogoConceptLockupType,
} from "./schemas"
import {
  createFallbackBrandOutput,
  errorToMessage,
  parseJsonObject,
} from "./utils"

type RunRequestContext = ReturnType<typeof createBuildRunRequestContext>

const REQUIRED_CONCEPT_TYPES: LogoConceptLockupType[] = [
  "icon_only",
  "icon_with_wordmark",
  "wordmark_only",
]

const TEXT_ELEMENT_PATTERN = /<(text|tspan)\b/i
const GRAPHIC_ELEMENT_PATTERN = /<(path|circle|ellipse|rect|polygon|polyline|line|use|image)\b/i

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asRecordArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
}

function isLikelySvg(value: string) {
  return /<svg[\s>]/i.test(value) && /<\/svg>/i.test(value)
}

function conceptIdFromName(name: string, fallbackIndex: number) {
  const hash = createHash("sha1").update(name).digest("hex")
  return `concept-${fallbackIndex + 1}-${hash.slice(0, 6)}`
}

function normalizeConceptType(value: unknown): LogoConceptLockupType | null {
  const raw = asString(value)?.toLowerCase()
  if (!raw) {
    return null
  }

  if (["icon_only", "icon-only", "icon", "symbol", "mark"].includes(raw)) {
    return "icon_only"
  }

  if (
    [
      "icon_with_wordmark",
      "icon+wordmark",
      "icon_wordmark",
      "full",
      "full_mark",
      "combination",
      "combo",
    ].includes(raw)
  ) {
    return "icon_with_wordmark"
  }

  if (["wordmark_only", "wordmark-only", "wordmark", "text", "text_only"].includes(raw)) {
    return "wordmark_only"
  }

  return null
}

function detectConceptTypeFromSvg(svg: string): LogoConceptLockupType | null {
  const hasText = TEXT_ELEMENT_PATTERN.test(svg)
  const hasGraphics = GRAPHIC_ELEMENT_PATTERN.test(svg)

  if (hasGraphics && !hasText) {
    return "icon_only"
  }
  if (hasGraphics && hasText) {
    return "icon_with_wordmark"
  }
  if (!hasGraphics && hasText) {
    return "wordmark_only"
  }
  return null
}

function svgFingerprint(svg: string) {
  const normalized = svg.replace(/\s+/g, " ").trim()
  return createHash("sha1").update(normalized).digest("hex")
}

function normalizeConcept(
  raw: Record<string, unknown>,
  fallbackIndex: number
): LogoConcept | null {
  const conceptName =
    asString(raw.conceptName) ??
    asString(raw.name) ??
    asString(raw.title) ??
    `Concept ${fallbackIndex + 1}`
  const rationaleMd =
    asString(raw.rationaleMd) ??
    asString(raw.rationale) ??
    asString(raw.description) ??
    "No rationale provided."
  const logoSvgValue = raw.logoSvg ?? raw.logo ?? raw.svg
  const logoSvgRecord = asRecord(logoSvgValue)
  const logoSvg =
    asString(logoSvgRecord?.full) ??
    asString(logoSvgRecord?.icon) ??
    asString(logoSvgRecord?.wordmark) ??
    asString(logoSvgValue)

  if (!logoSvg || !isLikelySvg(logoSvg)) {
    return null
  }

  const explicitConceptType =
    normalizeConceptType(raw.conceptType) ??
    normalizeConceptType(raw.lockupType) ??
    normalizeConceptType(raw.variantType) ??
    normalizeConceptType(raw.type)
  const detectedConceptType = detectConceptTypeFromSvg(logoSvg)
  const conceptType = detectedConceptType ?? explicitConceptType
  if (!conceptType) {
    return null
  }
  if (
    explicitConceptType &&
    detectedConceptType &&
    explicitConceptType !== detectedConceptType
  ) {
    return null
  }

  const conceptId =
    asString(raw.id) ?? conceptIdFromName(`${conceptType}-${conceptName}`, fallbackIndex)

  return {
    id: conceptId,
    conceptType,
    conceptName,
    rationaleMd,
    logoSvg,
  }
}

function buildSyntheticConceptsFromLogoSvgSet(container: Record<string, unknown>) {
  const logoSvgRecord = asRecord(container.logoSvg)
  if (!logoSvgRecord) {
    return []
  }

  const baseName = asString(container.conceptName) ?? "Logo System"
  const baseRationale =
    asString(container.rationaleMd) ??
    asString(container.rationale) ??
    "Synthesized from logoSvg.full/icon/wordmark response."

  const iconSvg = asString(logoSvgRecord.icon)
  const fullSvg = asString(logoSvgRecord.full)
  const wordmarkSvg = asString(logoSvgRecord.wordmark)
  if (!iconSvg || !fullSvg || !wordmarkSvg) {
    return []
  }

  return [
    {
      id: "concept-icon-derived",
      conceptType: "icon_only",
      conceptName: `${baseName} Icon`,
      rationaleMd: `${baseRationale}\n\nLockup: icon-only.`,
      logoSvg: iconSvg,
    },
    {
      id: "concept-full-derived",
      conceptType: "icon_with_wordmark",
      conceptName: `${baseName} Full`,
      rationaleMd: `${baseRationale}\n\nLockup: icon with wordmark.`,
      logoSvg: fullSvg,
    },
    {
      id: "concept-wordmark-derived",
      conceptType: "wordmark_only",
      conceptName: `${baseName} Wordmark`,
      rationaleMd: `${baseRationale}\n\nLockup: wordmark-only.`,
      logoSvg: wordmarkSvg,
    },
  ]
}

function normalizeConceptList(
  parsed: Record<string, unknown> | null
): {
  logoConcepts: LogoConcept[]
  selectedConceptId?: string
} | null {
  if (!parsed) {
    return null
  }

  const container = asRecord(parsed.brand) ?? asRecord(parsed.output) ?? parsed
  const arrayConcepts =
    asRecordArray(container.logoConcepts).length > 0
      ? asRecordArray(container.logoConcepts)
      : asRecordArray(container.concepts).length > 0
      ? asRecordArray(container.concepts)
      : asRecordArray(container.logoVariants)

  const rawConcepts =
    arrayConcepts.length > 0
      ? arrayConcepts
      : buildSyntheticConceptsFromLogoSvgSet(container)

  const normalized = rawConcepts
    .map((item, index) => normalizeConcept(item, index))
    .filter((item): item is LogoConcept => item !== null)

  if (normalized.length === 0) {
    return null
  }

  const byType = new Map<LogoConceptLockupType, LogoConcept[]>()
  for (const conceptType of REQUIRED_CONCEPT_TYPES) {
    byType.set(conceptType, [])
  }

  for (const concept of normalized) {
    const bucket = byType.get(concept.conceptType)
    if (!bucket) {
      continue
    }
    const fingerprint = svgFingerprint(concept.logoSvg)
    if (bucket.some((item) => svgFingerprint(item.logoSvg) === fingerprint)) {
      continue
    }
    bucket.push(concept)
  }

  const selected: LogoConcept[] = []
  for (const conceptType of REQUIRED_CONCEPT_TYPES) {
    const candidate = byType.get(conceptType)?.[0]
    if (!candidate) {
      return null
    }
    selected.push(candidate)
  }

  const selectedConceptId =
    asString(container.selectedConceptId) ??
    asString(container.primaryConceptId) ??
    selected.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
    selected[0]?.id

  return {
    logoConcepts: selected,
    selectedConceptId: selectedConceptId ?? undefined,
  }
}

function pickConceptByType(
  concepts: LogoConcept[],
  conceptType: LogoConceptLockupType
) {
  return concepts.find((item) => item.conceptType === conceptType) ?? null
}

function buildBrandOutputFromConcepts(inputData: {
  logoConcepts: LogoConcept[]
  selectedConceptId: string
}) {
  const selectedConcept =
    inputData.logoConcepts.find((item) => item.id === inputData.selectedConceptId) ??
    pickConceptByType(inputData.logoConcepts, "icon_with_wordmark") ??
    inputData.logoConcepts[0]
  const fullConcept =
    pickConceptByType(inputData.logoConcepts, "icon_with_wordmark") ??
    selectedConcept
  const iconConcept =
    pickConceptByType(inputData.logoConcepts, "icon_only") ?? selectedConcept
  const wordmarkConcept =
    pickConceptByType(inputData.logoConcepts, "wordmark_only") ?? selectedConcept

  return {
    selectedConcept,
    brandOutput: {
      conceptName: selectedConcept.conceptName,
      rationaleMd: selectedConcept.rationaleMd,
      logoSvg: {
        full: fullConcept.logoSvg,
        icon: iconConcept.logoSvg,
        wordmark: wordmarkConcept.logoSvg,
      },
      brandGuidelines:
        "Primary concept selected from three lockup-specific in-memory SVG explorations (icon-only, icon+wordmark, wordmark-only).",
    },
  }
}

function buildConceptsPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "You are in step 2 of a strict logo workflow.",
    "Generate exactly 3 SVG lockups for the same brand identity.",
    "Return JSON only. No markdown. No code fences. No extra prose.",
    "JSON shape:",
    JSON.stringify({
      logoConcepts: [
        {
          id: "string",
          conceptType: "icon_only",
          conceptName: "string",
          rationaleMd: "string",
          logoSvg: "<svg...></svg>",
        },
        {
          id: "string",
          conceptType: "icon_with_wordmark",
          conceptName: "string",
          rationaleMd: "string",
          logoSvg: "<svg...></svg>",
        },
        {
          id: "string",
          conceptType: "wordmark_only",
          conceptName: "string",
          rationaleMd: "string",
          logoSvg: "<svg...></svg>",
        },
      ],
      selectedConceptId: "string",
    }),
    "Hard rules:",
    "- logoConcepts length must be exactly 3",
    "- conceptType must include exactly one of each: icon_only, icon_with_wordmark, wordmark_only",
    "- icon_only SVG: must contain graphics and must NOT include <text> or <tspan>",
    "- icon_with_wordmark SVG: must include both graphics and <text>/<tspan>",
    "- wordmark_only SVG: must include <text>/<tspan> and must NOT include graphics tags (path/circle/ellipse/rect/polygon/polyline/line/use/image)",
    "- selectedConceptId must match one concept id",
    "- keep all outputs aligned with the brief constraints",
    `Original prompt: ${inputData.prompt}`,
    `Logo brief markdown:\n${inputData.logoBriefMarkdown}`,
  ]
  if (inputData.brandBrief) {
    parts.push(`Structured brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }
  return parts.join("\n\n")
}

function buildConceptsRepairPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  invalidOutput: string
  validationHint?: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "Your previous output is invalid.",
    "Fix it and return JSON only. No markdown. No code fences.",
    "Required JSON shape:",
    JSON.stringify({
      logoConcepts: [
        {
          id: "string",
          conceptType: "icon_only | icon_with_wordmark | wordmark_only",
          conceptName: "string",
          rationaleMd: "string",
          logoSvg: "<svg...></svg>",
        },
      ],
      selectedConceptId: "string",
    }),
    "Hard rules:",
    "- output exactly 3 concepts",
    "- conceptType must include exactly one icon_only, one icon_with_wordmark, one wordmark_only",
    "- icon_only must have no <text>/<tspan>",
    "- icon_with_wordmark must include both text and graphics",
    "- wordmark_only must include text and no graphics tags",
    "- selectedConceptId must match one concept id",
    inputData.validationHint ? `Validation hint: ${inputData.validationHint}` : "",
    `Original prompt: ${inputData.prompt}`,
    `Logo brief markdown:\n${inputData.logoBriefMarkdown}`,
    inputData.brandBrief ? `Structured brand brief: ${JSON.stringify(inputData.brandBrief)}` : "",
    `Invalid output to repair: ${inputData.invalidOutput}`,
  ]

  return parts.filter(Boolean).join("\n\n")
}

function buildFallbackConcepts(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
}) {
  const fallback = createFallbackBrandOutput({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
  })

  const baseConcepts: LogoConcept[] = [
    {
      id: "concept-1-fallback",
      conceptType: "icon_only",
      conceptName: `${fallback.conceptName} Icon`,
      rationaleMd: `${fallback.rationaleMd}\n\nDirection: simplified icon-only mark.`,
      logoSvg: fallback.logoSvg.icon,
    },
    {
      id: "concept-2-fallback",
      conceptType: "icon_with_wordmark",
      conceptName: `${fallback.conceptName} Full`,
      rationaleMd: `${fallback.rationaleMd}\n\nDirection: icon with wordmark lockup.`,
      logoSvg: fallback.logoSvg.full,
    },
    {
      id: "concept-3-fallback",
      conceptType: "wordmark_only",
      conceptName: `${fallback.conceptName} Wordmark`,
      rationaleMd: `${fallback.rationaleMd}\n\nDirection: typographic wordmark-only lockup.`,
      logoSvg: fallback.logoSvg.wordmark,
    },
  ]

  return {
    logoConcepts: baseConcepts,
    selectedConceptId: baseConcepts[1].id,
  }
}

async function generateConceptsWithRecovery(inputData: {
  prompt: string
  logoBriefMarkdown: string
  brandBrief?: Record<string, unknown>
  requestContext: RunRequestContext
}) {
  let initialText = ""
  let validationHint =
    "Missing required lockup set: one icon_only, one icon_with_wordmark, one wordmark_only."

  try {
    const output = await brandDesignerAgent.generate(
      buildConceptsPrompt({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        brandBrief: inputData.brandBrief,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )

    initialText = output.text ?? ""
    const parsed = parseJsonObject(initialText)
    const normalized = normalizeConceptList(parsed)
    if (normalized && normalized.logoConcepts.length === 3) {
      return {
        logoConcepts: normalized.logoConcepts,
        selectedConceptId:
          normalized.selectedConceptId ??
          normalized.logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
          normalized.logoConcepts[0]?.id ??
          "",
      }
    }
    validationHint =
      "Parsed JSON did not meet lockup contract (icon_only/icon_with_wordmark/wordmark_only)."
  } catch {
    validationHint = "Initial generation failed. Regenerate with strict lockup contract."
  }

  if (initialText.trim()) {
    try {
      const repaired = await brandDesignerAgent.generate(
        buildConceptsRepairPrompt({
          prompt: inputData.prompt,
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          brandBrief: inputData.brandBrief,
          invalidOutput: initialText.slice(0, 8000),
          validationHint,
        }),
        {
          requestContext: inputData.requestContext,
          toolChoice: "none",
        }
      )
      const repairedText = repaired.text ?? ""
      const parsed = parseJsonObject(repairedText)
      const normalized = normalizeConceptList(parsed)
      if (normalized && normalized.logoConcepts.length === 3) {
        return {
          logoConcepts: normalized.logoConcepts,
          selectedConceptId:
            normalized.selectedConceptId ??
            normalized.logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
            normalized.logoConcepts[0]?.id ??
            "",
        }
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  return buildFallbackConcepts({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
  })
}

export const brandDesignStep = createStep({
  id: "logo_brand_design",
  description: "Generate 3 SVG logo concepts (in-memory) using brand-logo-generation skill",
  inputSchema: logoDesignBriefOutputSchema,
  outputSchema: logoDesignConceptOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingResult = run?.resultJson as
        | {
            brand?: Record<string, unknown>
            logoConcepts?: unknown
            selectedConceptId?: unknown
          }
        | null

      const existingConcepts = normalizeConceptList({
        logoConcepts:
          existingResult?.logoConcepts ??
          asRecord(existingResult?.brand)?.logoConcepts,
        selectedConceptId:
          existingResult?.selectedConceptId ??
          asRecord(existingResult?.brand)?.selectedConceptId,
      })

      if (existingConcepts && existingConcepts.logoConcepts.length === 3) {
        const logoConcepts = existingConcepts.logoConcepts
        const selectedConceptId =
          existingConcepts.selectedConceptId ??
          logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
          logoConcepts[0].id
        const { selectedConcept, brandOutput } = buildBrandOutputFromConcepts({
          logoConcepts,
          selectedConceptId,
        })

        return {
          ...inputData,
          logoConcepts,
          selectedConceptId: selectedConcept.id,
          brandOutput,
        }
      }

      await logoDesignService.markStage(inputData.runId, "brand_designing")

      const requestContext = createBuildRunRequestContext({
        userId: inputData.userId,
        runId: inputData.runId,
      })

      const generated = await generateConceptsWithRecovery({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        requestContext,
      })

      const logoConcepts = generated.logoConcepts.slice(0, 3)
      const selectedConceptId =
        generated.selectedConceptId ||
        logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ||
        logoConcepts[0].id
      const { selectedConcept, brandOutput } = buildBrandOutputFromConcepts({
        logoConcepts,
        selectedConceptId,
      })

      await logoDesignService.updateRun(inputData.runId, {
        stage: "brand_designing",
        status: "running",
        resultJson: {
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          logoConcepts,
          selectedConceptId: selectedConcept.id,
          brand: {
            ...brandOutput,
            logoConcepts,
            selectedConceptId: selectedConcept.id,
          },
        },
      })

      return {
        ...inputData,
        logoConcepts,
        selectedConceptId: selectedConcept.id,
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
