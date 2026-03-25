import { createHash } from "node:crypto"

import { createStep } from "@mastra/inngest"

import { brandDesignerAgent } from "@/server/mastra/agents/logo-studio/brand-designer-agent"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { createBuildRunRequestContext } from "@/server/mastra/inngest/request-context"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"

import {
  logoConceptBlueprintSchema,
  logoDesignBriefOutputSchema,
  logoDesignConceptOutputSchema,
  logoGenerationDebugSchema,
  type LogoConcept,
  type LogoConceptBlueprint,
  type LogoConceptLockupType,
  type LogoGenerationDebug,
  type LogoGenerationStageDebug,
} from "./schemas"
import {
  chooseFallbackLogoStrategy,
  createFallbackBrandOutput,
  createFallbackConceptBlueprint,
  type FallbackLogoStrategy,
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
const GRAPHIC_TAG_PATTERN =
  /<(path|circle|ellipse|rect|polygon|polyline|line|use|image)\b([^>]*)\/?>/gi

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

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item))
}

function splitListText(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(/\r?\n|[•·;]/)
    .map((item) => item.replace(/^[\s,-]+/, "").trim())
    .filter(Boolean)
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

function readStyleValue(style: string | null, name: string) {
  if (!style) {
    return null
  }

  const match = new RegExp(`${name}\\s*:\\s*([^;]+)`, "i").exec(style)
  return match?.[1]?.trim() ?? null
}

function readAttr(attrs: string, name: string) {
  const directMatch = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i").exec(attrs)
  if (directMatch?.[1]) {
    return directMatch[1].trim()
  }

  const style = new RegExp(`style\\s*=\\s*["']([^"']+)["']`, "i").exec(attrs)?.[1] ?? null
  return readStyleValue(style, name)
}

function isZeroLike(value: string | null) {
  if (!value) {
    return false
  }
  return /^0(?:\.0+)?$/.test(value.trim())
}

function hasVisibleFill(tagName: string, attrs: string) {
  if (tagName === "line" || tagName === "polyline") {
    return false
  }

  const fill = readAttr(attrs, "fill")
  if (fill) {
    const normalized = fill.toLowerCase()
    if (normalized === "none" || normalized === "transparent") {
      return false
    }
  }

  return !isZeroLike(readAttr(attrs, "fill-opacity"))
}

function hasVisibleStroke(attrs: string) {
  const stroke = readAttr(attrs, "stroke")
  if (!stroke) {
    return false
  }

  const normalized = stroke.toLowerCase()
  if (normalized === "none" || normalized === "transparent") {
    return false
  }

  if (isZeroLike(readAttr(attrs, "stroke-opacity"))) {
    return false
  }

  if (isZeroLike(readAttr(attrs, "stroke-width"))) {
    return false
  }

  return true
}

function isHiddenGraphic(attrs: string) {
  const display = readAttr(attrs, "display")?.toLowerCase()
  const visibility = readAttr(attrs, "visibility")?.toLowerCase()
  const opacity = readAttr(attrs, "opacity")

  return display === "none" || visibility === "hidden" || isZeroLike(opacity)
}

function hasVisibleGraphicElements(svg: string) {
  const content = svg.replace(/<defs[\s\S]*?<\/defs>/gi, " ")
  GRAPHIC_TAG_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = GRAPHIC_TAG_PATTERN.exec(content))) {
    const tagName = match[1]?.toLowerCase()
    const attrs = match[2] ?? ""
    if (!tagName || isHiddenGraphic(attrs)) {
      continue
    }

    if (tagName === "image" || tagName === "use") {
      return true
    }

    if (hasVisibleFill(tagName, attrs) || hasVisibleStroke(attrs)) {
      return true
    }
  }

  return false
}

export function detectConceptTypeFromSvg(svg: string): LogoConceptLockupType | null {
  const hasText = TEXT_ELEMENT_PATTERN.test(svg)
  const hasGraphics = hasVisibleGraphicElements(svg)

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

function hasExplicitConceptConflict(
  explicitConceptType: LogoConceptLockupType,
  svg: string
) {
  const hasText = TEXT_ELEMENT_PATTERN.test(svg)
  const hasGraphics = hasVisibleGraphicElements(svg)

  if (explicitConceptType === "icon_only") {
    return hasText || !hasGraphics
  }
  if (explicitConceptType === "icon_with_wordmark") {
    return !hasText || !hasGraphics
  }
  return hasGraphics || !hasText
}

function svgFingerprint(svg: string) {
  const normalized = svg.replace(/\s+/g, " ").trim()
  return createHash("sha1").update(normalized).digest("hex")
}

function normalizeConcept(
  raw: Record<string, unknown>,
  fallbackIndex: number
): { concept: LogoConcept | null; reason: string | null } {
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
    return {
      concept: null,
      reason: `${conceptName} is missing complete SVG markup in logoSvg.`,
    }
  }

  const explicitConceptType =
    normalizeConceptType(raw.conceptType) ??
    normalizeConceptType(raw.lockupType) ??
    normalizeConceptType(raw.variantType) ??
    normalizeConceptType(raw.type)
  const detectedConceptType = detectConceptTypeFromSvg(logoSvg)

  if (explicitConceptType && hasExplicitConceptConflict(explicitConceptType, logoSvg)) {
    return {
      concept: null,
      reason: `${conceptName} declares ${explicitConceptType} but its SVG does not satisfy that lockup contract.`,
    }
  }

  const conceptType = explicitConceptType ?? detectedConceptType
  if (!conceptType) {
    return {
      concept: null,
      reason: `${conceptName} could not be classified as icon_only, icon_with_wordmark, or wordmark_only.`,
    }
  }

  const conceptId =
    asString(raw.id) ?? conceptIdFromName(`${conceptType}-${conceptName}`, fallbackIndex)

  return {
    concept: {
      id: conceptId,
      conceptType,
      conceptName,
      rationaleMd,
      logoSvg,
    },
    reason: null,
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

function normalizeConceptBlueprint(raw: Record<string, unknown> | null) {
  const container = asRecord(raw?.conceptBlueprint) ?? asRecord(raw?.blueprint) ?? raw
  if (!container) {
    return null
  }

  const constructionPrinciples = Array.from(
    new Set([
      ...asStringArray(container.constructionPrinciples),
      ...asStringArray(container.principles),
      ...splitListText(asString(container.constructionPrinciples)),
      ...splitListText(asString(container.principles)),
    ])
  ).slice(0, 6)

  const avoidMotifs = Array.from(
    new Set([
      ...asStringArray(container.avoidMotifs),
      ...asStringArray(container.avoidList),
      ...splitListText(asString(container.avoidMotifs)),
      ...splitListText(asString(container.avoidList)),
    ])
  ).slice(0, 8)

  const normalized = logoConceptBlueprintSchema.safeParse({
    conceptName:
      asString(container.conceptName) ??
      asString(container.name) ??
      asString(container.title),
    coreIdea:
      asString(container.coreIdea) ??
      asString(container.coreMetaphor) ??
      asString(container.conceptCore),
    silhouetteStrategy:
      asString(container.silhouetteStrategy) ??
      asString(container.silhouette) ??
      asString(container.silhouetteLogic),
    constructionPrinciples,
    wordmarkDirection:
      asString(container.wordmarkDirection) ??
      asString(container.typographyDirection) ??
      asString(container.wordmarkSystem),
    colorStrategy:
      asString(container.colorStrategy) ??
      asString(container.paletteStrategy) ??
      asString(container.colorUse),
    avoidMotifs: avoidMotifs.length > 0 ? avoidMotifs : undefined,
  })

  return normalized.success ? normalized.data : null
}

function createStageDebug(
  input: Partial<LogoGenerationStageDebug>
): LogoGenerationStageDebug {
  return {
    initialStatus: "error",
    repairAttempted: false,
    repairStatus: "not_attempted",
    fallbackUsed: false,
    ...input,
  }
}

function analyzeBlueprintResponse(parsed: Record<string, unknown> | null) {
  if (!parsed) {
    return {
      normalized: null,
      validationHint:
        "Return JSON with a conceptBlueprint object containing conceptName, coreIdea, silhouetteStrategy, 3-6 constructionPrinciples, wordmarkDirection, and colorStrategy.",
    }
  }

  const blueprint = normalizeConceptBlueprint(parsed)
  if (!blueprint) {
    return {
      normalized: null,
      validationHint:
        "conceptBlueprint is missing required fields or does not include 3-6 constructionPrinciples.",
    }
  }

  return {
    normalized: blueprint,
    validationHint: "Blueprint response looks valid.",
  }
}

export function analyzeConceptResponse(parsed: Record<string, unknown> | null) {
  if (!parsed) {
    return {
      normalized: null,
      validationHint:
        "Return JSON with exactly three logoConcepts and one selectedConceptId.",
    }
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

  if (rawConcepts.length === 0) {
    return {
      normalized: null,
      validationHint:
        "No logoConcepts array was found. Return exactly three lockups: icon_only, icon_with_wordmark, and wordmark_only.",
    }
  }

  const normalizationErrors: string[] = []
  const normalized = rawConcepts
    .map((item, index) => normalizeConcept(item, index))
    .flatMap((result) => {
      if (!result.concept) {
        if (result.reason) {
          normalizationErrors.push(result.reason)
        }
        return []
      }
      return [result.concept]
    })

  if (normalized.length === 0) {
    return {
      normalized: null,
      validationHint:
        normalizationErrors[0] ??
        "No valid SVG lockups were produced. Ensure each lockup contains complete SVG markup.",
    }
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

  const missingTypes = REQUIRED_CONCEPT_TYPES.filter((conceptType) => {
    return (byType.get(conceptType)?.length ?? 0) === 0
  })

  if (missingTypes.length > 0) {
    return {
      normalized: null,
      validationHint: `Missing required lockup types: ${missingTypes.join(", ")}.`,
    }
  }

  const selected = REQUIRED_CONCEPT_TYPES.map((conceptType) => {
    return byType.get(conceptType)?.[0]
  }).filter((item): item is LogoConcept => item !== undefined)

  const selectedConceptIdRaw =
    asString(container.selectedConceptId) ?? asString(container.primaryConceptId)
  const selectedConceptId = selected.some((item) => item.id === selectedConceptIdRaw)
    ? selectedConceptIdRaw
    : selected.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
      selected[0]?.id

  return {
    normalized: {
      logoConcepts: selected,
      selectedConceptId: selectedConceptId ?? undefined,
    },
    validationHint: "Concept response looks valid.",
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
  conceptBlueprint?: LogoConceptBlueprint
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

  const blueprint = inputData.conceptBlueprint
  const brandGuidelines = blueprint
    ? [
        `Master concept: ${blueprint.coreIdea}`,
        `Silhouette: ${blueprint.silhouetteStrategy}`,
        `Wordmark: ${blueprint.wordmarkDirection}`,
      ].join(" ")
    : "Primary concept selected from three lockup-specific SVG explorations."

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
      brandGuidelines,
    },
  }
}

function buildBlueprintPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "You are in step 2A of a logo identity workflow.",
    "Create exactly one logo concept blueprint for a single identity direction.",
    "You are designing a logo system, not a poster, art print, or canvas composition.",
    "Synthesize the brief into one refined concept instead of proposing multiple unrelated directions.",
    "Prioritize distinctiveness, silhouette clarity, black-and-white-first strength, and small-size legibility.",
    "Avoid generic startup geometry unless the brief explicitly asks for it.",
    "Return JSON only. No markdown. No code fences. No extra prose.",
    "JSON shape:",
    JSON.stringify({
      conceptBlueprint: {
        conceptName: "string",
        coreIdea: "string",
        silhouetteStrategy: "string",
        constructionPrinciples: ["string", "string", "string"],
        wordmarkDirection: "string",
        colorStrategy: "string",
        avoidMotifs: ["string"],
      },
    }),
    "Hard rules:",
    "- choose one master concept only",
    "- constructionPrinciples must contain 3 to 6 actionable rules",
    "- no stars, sparks, AI brains, circuit traces, or random polygons unless the brief explicitly demands them",
    "- the concept must be specific enough that a second model could draw consistent SVG lockups from it",
    `Original prompt: ${inputData.prompt}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
  ]

  if (inputData.brandBrief) {
    parts.push(`Structured brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }

  return parts.join("\n\n")
}

function buildBlueprintRepairPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  invalidOutput: string
  validationHint: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "Your previous logo blueprint output was invalid.",
    "Fix it and return JSON only. No markdown. No code fences.",
    "Required JSON shape:",
    JSON.stringify({
      conceptBlueprint: {
        conceptName: "string",
        coreIdea: "string",
        silhouetteStrategy: "string",
        constructionPrinciples: ["string", "string", "string"],
        wordmarkDirection: "string",
        colorStrategy: "string",
        avoidMotifs: ["string"],
      },
    }),
    `Validation hint: ${inputData.validationHint}`,
    `Original prompt: ${inputData.prompt}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
    inputData.brandBrief ? `Structured brand brief: ${JSON.stringify(inputData.brandBrief)}` : "",
    `Invalid output to repair: ${inputData.invalidOutput}`,
  ]

  return parts.filter(Boolean).join("\n\n")
}

function buildConceptsPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  conceptBlueprint: LogoConceptBlueprint
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "You are in step 2B of a logo identity workflow.",
    "Generate exactly three SVG lockups from the provided single concept blueprint.",
    "These are three lockups of one identity, not three separate creative directions.",
    "You are designing logo assets, not posters or canvas compositions.",
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
    "- icon_only SVG: must contain visible graphics and must NOT include <text> or <tspan>",
    "- icon_with_wordmark SVG: must include both visible graphics and <text>/<tspan>",
    "- wordmark_only SVG: must include <text>/<tspan>; <defs> and invisible layout guides are allowed, but no visible symbol graphics",
    "- selectedConceptId must match one concept id and should normally point to icon_with_wordmark",
    "- keep all three lockups faithful to the same concept blueprint",
    "- avoid gradients, 3D effects, and stock AI symbols unless the brief or blueprint explicitly requires them",
    `Original prompt: ${inputData.prompt}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
    `Concept blueprint JSON:\n${JSON.stringify(inputData.conceptBlueprint)}`,
  ]

  if (inputData.brandBrief) {
    parts.push(`Structured brand brief: ${JSON.stringify(inputData.brandBrief)}`)
  }

  return parts.join("\n\n")
}

function buildConceptsRepairPrompt(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  conceptBlueprint: LogoConceptBlueprint
  invalidOutput: string
  validationHint: string
  brandBrief?: Record<string, unknown>
}) {
  const parts = [
    "Your previous logo lockup output is invalid.",
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
    "- include exactly one icon_only, one icon_with_wordmark, one wordmark_only",
    "- wordmark_only may use <defs> or invisible layout helpers, but it must not contain a visible symbol",
    `Validation hint: ${inputData.validationHint}`,
    `Original prompt: ${inputData.prompt}`,
    `Brand context markdown:\n${inputData.logoBriefMarkdown}`,
    `Canonical design philosophy markdown:\n${inputData.designPhilosophyMarkdown}`,
    `Concept blueprint JSON:\n${JSON.stringify(inputData.conceptBlueprint)}`,
    inputData.brandBrief ? `Structured brand brief: ${JSON.stringify(inputData.brandBrief)}` : "",
    `Invalid output to repair: ${inputData.invalidOutput}`,
  ]

  return parts.filter(Boolean).join("\n\n")
}

function buildFallbackConcepts(inputData: {
  prompt: string
  brandBrief?: Record<string, unknown>
  fallbackStrategy?: FallbackLogoStrategy
}) {
  const fallbackStrategy =
    inputData.fallbackStrategy ?? chooseFallbackLogoStrategy(inputData)
  const fallback = createFallbackBrandOutput({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
    fallbackStrategy,
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
    fallbackStrategy,
    brandOutput: fallback,
  }
}

async function generateBlueprintWithRecovery(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  brandBrief?: Record<string, unknown>
  requestContext: RunRequestContext
}) {
  let initialText = ""
  let initialStatus: LogoGenerationStageDebug["initialStatus"] = "error"
  let repairStatus: LogoGenerationStageDebug["repairStatus"] = "not_attempted"
  let validationHint =
    "Return a valid conceptBlueprint object with the required fields."
  let failureReason: string | undefined

  try {
    const output = await brandDesignerAgent.generate(
      buildBlueprintPrompt({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        brandBrief: inputData.brandBrief,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )

    initialText = output.text ?? ""
    const analysis = analyzeBlueprintResponse(parseJsonObject(initialText))
    if (analysis.normalized) {
      return {
        conceptBlueprint: analysis.normalized,
        debug: createStageDebug({
          initialStatus: "success",
          repairAttempted: false,
          repairStatus: "not_attempted",
          fallbackUsed: false,
        }),
        fallbackStrategy: undefined,
      }
    }

    initialStatus = "invalid"
    validationHint = analysis.validationHint
  } catch (error) {
    initialStatus = "error"
    failureReason = errorToMessage(error)
    validationHint =
      "Blueprint generation failed. Return the exact conceptBlueprint JSON contract."
  }

  try {
    const repaired = await brandDesignerAgent.generate(
      buildBlueprintRepairPrompt({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        brandBrief: inputData.brandBrief,
        invalidOutput: initialText.slice(0, 8000) || "<empty>",
        validationHint,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )

    const repairedText = repaired.text ?? ""
    const analysis = analyzeBlueprintResponse(parseJsonObject(repairedText))
    if (analysis.normalized) {
      return {
        conceptBlueprint: analysis.normalized,
        debug: createStageDebug({
          initialStatus,
          repairAttempted: true,
          repairStatus: "success",
          fallbackUsed: false,
        }),
        fallbackStrategy: undefined,
      }
    }

    repairStatus = "invalid"
    validationHint = analysis.validationHint
  } catch (error) {
    repairStatus = "error"
    failureReason = failureReason ?? errorToMessage(error)
  }

  const fallbackStrategy = chooseFallbackLogoStrategy(inputData)

  return {
    conceptBlueprint: createFallbackConceptBlueprint({
      prompt: inputData.prompt,
      brandBrief: inputData.brandBrief,
      fallbackStrategy,
    }),
    debug: createStageDebug({
      initialStatus,
      repairAttempted: true,
      repairStatus,
      fallbackUsed: true,
      failureReason,
      validationHint,
    }),
    fallbackStrategy,
  }
}

async function generateConceptsWithRecovery(inputData: {
  prompt: string
  logoBriefMarkdown: string
  designPhilosophyMarkdown: string
  conceptBlueprint: LogoConceptBlueprint
  brandBrief?: Record<string, unknown>
  requestContext: RunRequestContext
  fallbackStrategy?: FallbackLogoStrategy
}) {
  let initialText = ""
  let initialStatus: LogoGenerationStageDebug["initialStatus"] = "error"
  let repairStatus: LogoGenerationStageDebug["repairStatus"] = "not_attempted"
  let validationHint =
    "Return exactly three logoConcepts with one icon_only, one icon_with_wordmark, and one wordmark_only."
  let failureReason: string | undefined

  try {
    const output = await brandDesignerAgent.generate(
      buildConceptsPrompt({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        conceptBlueprint: inputData.conceptBlueprint,
        brandBrief: inputData.brandBrief,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )

    initialText = output.text ?? ""
    const analysis = analyzeConceptResponse(parseJsonObject(initialText))
    if (analysis.normalized) {
      return {
        ...analysis.normalized,
        debug: createStageDebug({
          initialStatus: "success",
          repairAttempted: false,
          repairStatus: "not_attempted",
          fallbackUsed: false,
        }),
        fallbackStrategy: undefined,
      }
    }

    initialStatus = "invalid"
    validationHint = analysis.validationHint
  } catch (error) {
    initialStatus = "error"
    failureReason = errorToMessage(error)
    validationHint =
      "Lockup generation failed. Return the exact three-lockup JSON contract."
  }

  try {
    const repaired = await brandDesignerAgent.generate(
      buildConceptsRepairPrompt({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        conceptBlueprint: inputData.conceptBlueprint,
        brandBrief: inputData.brandBrief,
        invalidOutput: initialText.slice(0, 8000) || "<empty>",
        validationHint,
      }),
      {
        requestContext: inputData.requestContext,
        toolChoice: "none",
      }
    )

    const repairedText = repaired.text ?? ""
    const analysis = analyzeConceptResponse(parseJsonObject(repairedText))
    if (analysis.normalized) {
      return {
        ...analysis.normalized,
        debug: createStageDebug({
          initialStatus,
          repairAttempted: true,
          repairStatus: "success",
          fallbackUsed: false,
        }),
        fallbackStrategy: undefined,
      }
    }

    repairStatus = "invalid"
    validationHint = analysis.validationHint
  } catch (error) {
    repairStatus = "error"
    failureReason = failureReason ?? errorToMessage(error)
  }

  const fallback = buildFallbackConcepts({
    prompt: inputData.prompt,
    brandBrief: inputData.brandBrief,
    fallbackStrategy: inputData.fallbackStrategy,
  })

  return {
    logoConcepts: fallback.logoConcepts,
    selectedConceptId: fallback.selectedConceptId,
    brandOutput: fallback.brandOutput,
    debug: createStageDebug({
      initialStatus,
      repairAttempted: true,
      repairStatus,
      fallbackUsed: true,
      failureReason,
      validationHint,
    }),
    fallbackStrategy: fallback.fallbackStrategy,
  }
}

export const brandDesignStep = createStep({
  id: "logo_brand_design",
  description: "Generate 3 SVG logo lockups from a single refined logo concept blueprint",
  inputSchema: logoDesignBriefOutputSchema,
  outputSchema: logoDesignConceptOutputSchema,
  execute: async ({ inputData }) => {
    try {
      const run = await logoDesignService.getRunById(inputData.runId)
      const existingResult = run?.resultJson as
        | {
            brand?: Record<string, unknown>
            conceptBlueprint?: unknown
            generationDebug?: unknown
            fallbackStrategy?: unknown
            logoConcepts?: unknown
            selectedConceptId?: unknown
          }
        | null

      const existingConcepts = analyzeConceptResponse({
        logoConcepts:
          existingResult?.logoConcepts ??
          asRecord(existingResult?.brand)?.logoConcepts,
        selectedConceptId:
          existingResult?.selectedConceptId ??
          asRecord(existingResult?.brand)?.selectedConceptId,
      }).normalized
      const existingBlueprint = normalizeConceptBlueprint(
        asRecord(existingResult?.conceptBlueprint)
      )
      const existingGenerationDebug = logoGenerationDebugSchema.safeParse(
        asRecord(existingResult?.generationDebug)
      ).success
        ? logoGenerationDebugSchema.parse(asRecord(existingResult?.generationDebug))
        : undefined
      const existingFallbackStrategy = asString(existingResult?.fallbackStrategy)

      if (existingConcepts && existingConcepts.logoConcepts.length === 3) {
        const logoConcepts = existingConcepts.logoConcepts
        const selectedConceptId =
          existingConcepts.selectedConceptId ??
          logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ??
          logoConcepts[0].id
        const { selectedConcept, brandOutput } = buildBrandOutputFromConcepts({
          logoConcepts,
          selectedConceptId,
          conceptBlueprint: existingBlueprint ?? undefined,
        })

        return {
          ...inputData,
          conceptBlueprint: existingBlueprint ?? undefined,
          generationDebug: existingGenerationDebug,
          fallbackStrategy: existingFallbackStrategy ?? undefined,
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

      const blueprintGenerated = await generateBlueprintWithRecovery({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        requestContext,
      })

      const conceptsGenerated = await generateConceptsWithRecovery({
        prompt: inputData.prompt,
        logoBriefMarkdown: inputData.logoBriefMarkdown,
        designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
        conceptBlueprint: blueprintGenerated.conceptBlueprint,
        brandBrief: inputData.brandBrief as Record<string, unknown> | undefined,
        requestContext,
        fallbackStrategy: blueprintGenerated.fallbackStrategy,
      })

      const logoConcepts = conceptsGenerated.logoConcepts.slice(0, 3)
      const selectedConceptId =
        conceptsGenerated.selectedConceptId ||
        logoConcepts.find((item) => item.conceptType === "icon_with_wordmark")?.id ||
        logoConcepts[0].id
      const generationDebug: LogoGenerationDebug = {
        fallbackUsed:
          blueprintGenerated.debug.fallbackUsed || conceptsGenerated.debug.fallbackUsed,
        fallbackStrategy:
          conceptsGenerated.fallbackStrategy ?? blueprintGenerated.fallbackStrategy,
        blueprint: blueprintGenerated.debug,
        lockups: conceptsGenerated.debug,
      }
      const selectedConcept =
        logoConcepts.find((item) => item.id === selectedConceptId) ?? logoConcepts[0]
      const { brandOutput: derivedBrandOutput } = buildBrandOutputFromConcepts({
        logoConcepts,
        selectedConceptId,
        conceptBlueprint: blueprintGenerated.conceptBlueprint,
      })
      const brandOutput =
        conceptsGenerated.fallbackStrategy && conceptsGenerated.brandOutput
          ? {
              ...conceptsGenerated.brandOutput,
              conceptName: selectedConcept.conceptName,
              rationaleMd: selectedConcept.rationaleMd,
            }
          : derivedBrandOutput

      await logoDesignService.updateRun(inputData.runId, {
        stage: "brand_designing",
        status: "running",
        resultJson: {
          logoBriefMarkdown: inputData.logoBriefMarkdown,
          designPhilosophyMarkdown: inputData.designPhilosophyMarkdown,
          conceptBlueprint: blueprintGenerated.conceptBlueprint,
          generationDebug,
          fallbackStrategy: generationDebug.fallbackStrategy,
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
        conceptBlueprint: blueprintGenerated.conceptBlueprint,
        generationDebug,
        fallbackStrategy: generationDebug.fallbackStrategy,
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
