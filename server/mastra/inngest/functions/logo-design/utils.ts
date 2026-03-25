import { createHash } from "node:crypto"

import {
  logoBrandOutputSchema,
  logoPosterOutputSchema,
  type LogoBrandOutput,
  type LogoConceptBlueprint,
  type LogoPosterOutput,
} from "./schemas"

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

function pickJsonObject(value: unknown) {
  if (asRecord(value)) {
    return asRecord(value)
  }

  if (!Array.isArray(value)) {
    return null
  }

  for (const item of value) {
    const record = asRecord(item)
    if (record) {
      return record
    }
  }

  return null
}

function tryParseJsonObject(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    return pickJsonObject(JSON.parse(trimmed))
  } catch {
    // no-op
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    try {
      return pickJsonObject(JSON.parse(fencedMatch[1]))
    } catch {
      // no-op
    }
  }

  // Some models prepend reasoning (e.g. <think>...</think>) before the final JSON.
  // Try extracting the first balanced JSON object from mixed text.
  for (let start = 0; start < trimmed.length; start += 1) {
    if (trimmed[start] !== "{") {
      continue
    }

    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < trimmed.length; index += 1) {
      const char = trimmed[index]

      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (char === "\\") {
          escaped = true
          continue
        }
        if (char === "\"") {
          inString = false
        }
        continue
      }

      if (char === "\"") {
        inString = true
        continue
      }

      if (char === "{") {
        depth += 1
        continue
      }

      if (char === "}") {
        depth -= 1
        if (depth === 0) {
          const candidate = trimmed.slice(start, index + 1)
          try {
            return pickJsonObject(JSON.parse(candidate))
          } catch {
            // no-op
          }
          break
        }
      }
    }
  }

  return null
}

export function parseJsonObject(value: string) {
  return tryParseJsonObject(value)
}

function isLikelySvg(value: string) {
  return /<svg[\s>]/i.test(value) && /<\/svg>/i.test(value)
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function createStarPath({
  cx,
  cy,
  outerRadius,
  innerRadius,
}: {
  cx: number
  cy: number
  outerRadius: number
  innerRadius: number
}) {
  const points: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI / 5) * i
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `${points.join(" ")} Z`
}

function getBrandBrief(input: { brandBrief?: Record<string, unknown> }) {
  return asRecord(input.brandBrief ?? null)
}

function inferBrandName(input: { prompt: string; brandBrief?: Record<string, unknown> }) {
  const brief = getBrandBrief(input)
  const briefName = asString(brief?.brandName)
  if (briefName) {
    return briefName
  }

  const quotedChinese = input.prompt.match(/品牌\s*[\"“]([^\"”]+)[\"”]/)
  if (quotedChinese?.[1]) {
    return quotedChinese[1].trim()
  }

  const quotedEnglish = input.prompt.match(/brand\s*[\"']([^\"']+)[\"']/i)
  if (quotedEnglish?.[1]) {
    return quotedEnglish[1].trim()
  }

  return "init"
}

function inferWordmark(input: { prompt: string; brandBrief?: Record<string, unknown> }) {
  const brief = getBrandBrief(input)
  const requiredElements = Array.isArray(brief?.requiredElements)
    ? brief.requiredElements
    : []

  for (const item of requiredElements) {
    const text = asString(item)
    if (!text) {
      continue
    }
    const match = text.match(/(?:文字|text)\s*[:：]?\s*["“']?([A-Za-z0-9][A-Za-z0-9 _-]*)/i)
    if (match?.[1]) {
      return match[1].trim().slice(0, 24)
    }
  }

  const brandName = inferBrandName(input)
  const segments = brandName.split(/\s+/).filter(Boolean)
  const candidate = segments[segments.length - 1] ?? brandName
  return candidate.slice(0, 24) || "init"
}

function pickPalette(input: { brandBrief?: Record<string, unknown> }) {
  const brief = getBrandBrief(input)
  const avoidColor = asString(brief?.avoidColor)?.toLowerCase()
  const preferredText = [
    asString(brief?.preferredColors),
    ...asStringArray(brief?.preferredColors),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  const paletteCandidates = [
    { primary: "#00D4FF", secondary: "#14F1D9", neutral: "#0F172A" },
    { primary: "#00C2FF", secondary: "#22C55E", neutral: "#111827" },
    { primary: "#06B6D4", secondary: "#FF6B6B", neutral: "#0B1020" },
    { primary: "#1D4ED8", secondary: "#0F172A", neutral: "#020617" },
    { primary: "#F97316", secondary: "#FACC15", neutral: "#1F2937" },
  ]

  const preferredPalette =
    preferredText.includes("orange") || preferredText.includes("warm")
      ? paletteCandidates[4]
      : preferredText.includes("blue") ||
          preferredText.includes("navy") ||
          preferredText.includes("black")
      ? paletteCandidates[3]
      : null
  const candidatePalettes = preferredPalette
    ? [preferredPalette, ...paletteCandidates]
    : paletteCandidates

  return (
    candidatePalettes.find(
      (palette) =>
        !avoidColor ||
        ![palette.primary, palette.secondary, palette.neutral]
          .map((item) => item.toLowerCase())
          .includes(avoidColor)
    ) ?? preferredPalette ?? paletteCandidates[0]
  )
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item))
}

function flattenBriefText(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenBriefText(item))
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      flattenBriefText(item)
    )
  }

  return []
}

function includesAny(source: string, patterns: string[]) {
  return patterns.some((pattern) => source.includes(pattern))
}

function hashNumber(value: string) {
  return parseInt(createHash("sha1").update(value).digest("hex").slice(0, 8), 16)
}

function inferBrandInitials(name: string) {
  const segments = name
    .split(/[^A-Za-z0-9\u4e00-\u9fff]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (segments.length >= 2) {
    return `${segments[0]?.[0] ?? ""}${segments[1]?.[0] ?? ""}`.toUpperCase()
  }

  const single = segments[0] ?? name
  return single.slice(0, 2).toUpperCase() || "ID"
}

const DISPLAY_FONT = "Avenir Next, Poppins, Inter, Arial, sans-serif"
const BODY_FONT = "Inter, Arial, sans-serif"

export type FallbackLogoStrategy =
  | "wordmark_first"
  | "relay_loop"
  | "modular_grid"
  | "monogram"
  | "celestial_mark"

type FallbackArtDirection = {
  conceptName: string
  rationaleMd: string
  brandGuidelines: string
  iconDefs: string
  iconInner: string
  wordmarkWeight: number
  wordmarkLetterSpacing: number
}

export function chooseFallbackLogoStrategy(input: {
  prompt: string
  brandBrief?: Record<string, unknown>
}): FallbackLogoStrategy {
  const briefText = [input.prompt, ...flattenBriefText(getBrandBrief(input))]
    .join(" ")
    .toLowerCase()

  if (
    includesAny(briefText, [
      "star",
      "spark",
      "celestial",
      "constellation",
      "asterisk",
      "award",
      "stellar",
    ])
  ) {
    return "celestial_mark"
  }

  if (
    includesAny(briefText, [
      "relay",
      "handoff",
      "connection",
      "connect",
      "flow",
      "continuity",
      "loop",
      "bridge",
    ])
  ) {
    return "relay_loop"
  }

  if (
    includesAny(briefText, [
      "workspace",
      "system",
      "modular",
      "module",
      "grid",
      "dashboard",
      "organize",
      "organisation",
      "organization",
      "collaboration",
      "blocks",
    ])
  ) {
    return "modular_grid"
  }

  if (
    includesAny(briefText, [
      "personal brand",
      "founder",
      "portfolio",
      "signature",
      "monogram",
      "initials",
    ])
  ) {
    return "monogram"
  }

  return "wordmark_first"
}

function buildWordmarkSvg(input: {
  wordmark: string
  primary: string
  weight: number
  letterSpacing: number
}) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 120" role="img" aria-label="wordmark">',
    `<text x="0" y="82" font-size="76" font-weight="${input.weight}" letter-spacing="${input.letterSpacing}" fill="${input.primary}" font-family="${DISPLAY_FONT}">${input.wordmark}</text>`,
    "</svg>",
  ].join("")
}

function buildIconSvg(input: {
  brandName: string
  defs: string
  inner: string
}) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${input.brandName} icon">`,
    input.defs,
    input.inner,
    "</svg>",
  ].join("")
}

function buildFullSvg(input: {
  brandName: string
  wordmark: string
  defs: string
  inner: string
  primary: string
  weight: number
  letterSpacing: number
}) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 192" role="img" aria-label="${input.brandName} full logo">`,
    input.defs,
    '<g transform="translate(0 0) scale(0.75)">',
    input.inner,
    "</g>",
    `<text x="236" y="126" font-size="96" font-weight="${input.weight}" letter-spacing="${input.letterSpacing}" fill="${input.primary}" font-family="${DISPLAY_FONT}">${input.wordmark}</text>`,
    "</svg>",
  ].join("")
}

function buildFallbackArtDirection(input: {
  prompt: string
  brandBrief?: Record<string, unknown>
  fallbackStrategy: FallbackLogoStrategy
  palette: { primary: string; secondary: string; neutral: string }
}): FallbackArtDirection {
  const initials = inferBrandInitials(inferBrandName(input))
  const seed = hashNumber(`${inferBrandName(input)}:${input.fallbackStrategy}`)
  const monogramPeakY = 54 + (seed % 16)
  const monogramShoulderY = 106 + (seed % 18)

  switch (input.fallbackStrategy) {
    case "relay_loop":
      return {
        conceptName: "Quiet Relay Loop",
        rationaleMd:
          "Fallback concept generated after model recovery attempts: an open relay loop that stages handoff and continuity through two counter-rotating arcs, a bridging pulse, and restrained contrast.",
        brandGuidelines:
          "Use the loop icon where continuity or collaboration should read instantly. Preserve open terminals and the central handoff pulse; keep the wordmark calm, compact, and black-and-white-first.",
        iconDefs: [
          "<defs>",
          '<linearGradient id="relayGradient" x1="0" y1="0" x2="1" y2="1">',
          `<stop offset="0%" stop-color="${input.palette.primary}"/>`,
          `<stop offset="100%" stop-color="${input.palette.secondary}"/>`,
          "</linearGradient>",
          "</defs>",
        ].join(""),
        iconInner: [
          `<path d="M180 86 A62 62 0 1 1 180 170" fill="none" stroke="${input.palette.neutral}" stroke-width="22" stroke-linecap="round"/>`,
          '<path d="M76 170 A62 62 0 1 1 76 86" fill="none" stroke="url(#relayGradient)" stroke-width="22" stroke-linecap="round"/>',
          `<path d="M88 128H168" fill="none" stroke="${input.palette.primary}" stroke-width="18" stroke-linecap="round"/>`,
          `<circle cx="128" cy="128" r="11" fill="${input.palette.secondary}"/>`,
        ].join(""),
        wordmarkWeight: 650,
        wordmarkLetterSpacing: 1.2,
      }
    case "modular_grid":
      return {
        conceptName: "Modular Signal Grid",
        rationaleMd:
          "Fallback concept generated after model recovery attempts: a modular grid with a decisive relay path cut through it, turning workspace structure into a compact, legible symbol rather than a generic app badge.",
        brandGuidelines:
          "Keep the modules proportionally balanced and the central routing stroke prominent. The system should read as organized, collaborative, and usable before it reads as decorative.",
        iconDefs: [
          "<defs>",
          '<linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">',
          `<stop offset="0%" stop-color="${input.palette.primary}"/>`,
          `<stop offset="100%" stop-color="${input.palette.secondary}"/>`,
          "</linearGradient>",
          "</defs>",
        ].join(""),
        iconInner: [
          `<rect x="34" y="34" width="76" height="76" rx="22" fill="none" stroke="${input.palette.neutral}" stroke-width="16"/>`,
          `<rect x="146" y="34" width="76" height="76" rx="22" fill="none" stroke="${input.palette.neutral}" stroke-width="16"/>`,
          `<rect x="34" y="146" width="76" height="76" rx="22" fill="none" stroke="${input.palette.neutral}" stroke-width="16"/>`,
          `<rect x="146" y="146" width="76" height="76" rx="22" fill="none" stroke="${input.palette.neutral}" stroke-width="16"/>`,
          '<path d="M92 128H164V92" fill="none" stroke="url(#gridGradient)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>',
          `<circle cx="128" cy="128" r="10" fill="${input.palette.secondary}"/>`,
        ].join(""),
        wordmarkWeight: 700,
        wordmarkLetterSpacing: 1,
      }
    case "monogram":
      return {
        conceptName: `${initials} Monogram Frame`,
        rationaleMd:
          "Fallback concept generated after model recovery attempts: an abstract monogram scaffold built from mirrored stems and a single bridge, keeping the identity personal and structured without depending on literal lettering.",
        brandGuidelines:
          "Use the icon as a signature seal. Maintain the mirrored stems and the elevated bridge so the mark keeps its authored, signature-like tension.",
        iconDefs: [
          "<defs>",
          '<linearGradient id="monoGradient" x1="0" y1="0" x2="1" y2="1">',
          `<stop offset="0%" stop-color="${input.palette.primary}"/>`,
          `<stop offset="100%" stop-color="${input.palette.secondary}"/>`,
          "</linearGradient>",
          "</defs>",
        ].join(""),
        iconInner: [
          `<path d="M70 42V214" fill="none" stroke="${input.palette.neutral}" stroke-width="22" stroke-linecap="round"/>`,
          `<path d="M186 42V214" fill="none" stroke="${input.palette.neutral}" stroke-width="22" stroke-linecap="round"/>`,
          `<path d="M70 ${monogramShoulderY}L128 ${monogramPeakY}L186 ${monogramShoulderY}" fill="none" stroke="url(#monoGradient)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`,
          `<path d="M98 178H158" fill="none" stroke="${input.palette.secondary}" stroke-width="18" stroke-linecap="round"/>`,
        ].join(""),
        wordmarkWeight: 700,
        wordmarkLetterSpacing: 1.6,
      }
    case "celestial_mark": {
      const starPath = createStarPath({
        cx: 128,
        cy: 122,
        outerRadius: 62,
        innerRadius: 28,
      })
      return {
        conceptName: "Orbital Star Signal",
        rationaleMd:
          "Fallback concept generated after model recovery attempts: a refined orbital star reserved for briefs that explicitly invoke spark, celestial, or stellar cues, wrapped in a more deliberate system than the old generic startup badge.",
        brandGuidelines:
          "Reserve the star only for celestial or spark-led narratives. Keep the orbit stroke thin and the star compact so the mark still feels disciplined instead of celebratory or juvenile.",
        iconDefs: [
          "<defs>",
          '<linearGradient id="orbitalGradient" x1="0" y1="0" x2="1" y2="1">',
          `<stop offset="0%" stop-color="${input.palette.primary}"/>`,
          `<stop offset="100%" stop-color="${input.palette.secondary}"/>`,
          "</linearGradient>",
          "</defs>",
        ].join(""),
        iconInner: [
          `<circle cx="128" cy="128" r="82" fill="none" stroke="${input.palette.neutral}" stroke-width="10" opacity="0.22"/>`,
          `<path d="${starPath}" fill="url(#orbitalGradient)"/>`,
          `<path d="M64 180Q128 86 204 92" fill="none" stroke="${input.palette.neutral}" stroke-width="14" stroke-linecap="round" opacity="0.7"/>`,
        ].join(""),
        wordmarkWeight: 700,
        wordmarkLetterSpacing: 1.4,
      }
    }
    case "wordmark_first":
    default:
      return {
        conceptName: "Signal Serifless Wordmark",
        rationaleMd:
          "Fallback concept generated after model recovery attempts: a wordmark-first identity with a compact signal glyph, built around rhythm, notched alignment, and black-and-white-first clarity instead of a generic startup emblem.",
        brandGuidelines:
          "Prioritize the wordmark in primary usage. Treat the icon as a compact signal extracted from the typesetting rhythm, not as a separate mascot or badge.",
        iconDefs: [
          "<defs>",
          '<linearGradient id="typeGradient" x1="0" y1="0" x2="1" y2="1">',
          `<stop offset="0%" stop-color="${input.palette.primary}"/>`,
          `<stop offset="100%" stop-color="${input.palette.secondary}"/>`,
          "</linearGradient>",
          "</defs>",
        ].join(""),
        iconInner: [
          `<rect x="40" y="70" width="176" height="44" rx="22" fill="none" stroke="${input.palette.neutral}" stroke-width="18"/>`,
          '<path d="M74 150H182" fill="none" stroke="url(#typeGradient)" stroke-width="18" stroke-linecap="round"/>',
          `<path d="M128 70V186" fill="none" stroke="${input.palette.secondary}" stroke-width="18" stroke-linecap="round"/>`,
        ].join(""),
        wordmarkWeight: 760,
        wordmarkLetterSpacing: 1.8,
      }
  }
}

export function createFallbackConceptBlueprint(input: {
  prompt: string
  brandBrief?: Record<string, unknown>
  fallbackStrategy?: FallbackLogoStrategy
}): LogoConceptBlueprint {
  const strategy = input.fallbackStrategy ?? chooseFallbackLogoStrategy(input)
  const brandName = inferBrandName(input)

  switch (strategy) {
    case "relay_loop":
      return {
        conceptName: `${brandName} Quiet Relay`,
        coreIdea:
          "Express relay as a calm, continuous handoff built from two open arcs and one decisive transfer point, never as arrows or stock connectivity icons.",
        silhouetteStrategy:
          "A compact rounded loop with an open seam on each side so the mark feels in motion even when static.",
        constructionPrinciples: [
          "Use two mirrored open arcs with matched stroke weight.",
          "Place one short bridge at the center as the handoff event.",
          "Preserve negative space at the seams so the loop breathes at small sizes.",
          "Keep proportions stable enough to survive monochrome favicon scale.",
        ],
        wordmarkDirection:
          "Lowercase or titlecase grotesk with gentle spacing and one or two subtle refinements, staying calmer than the icon.",
        colorStrategy:
          "Prove the icon in black and white first; if accent is used, keep it to a single relay pulse rather than full-surface decoration.",
        avoidMotifs: [
          "stars",
          "sparks",
          "AI brains",
          "circuit traces",
          "literal arrows",
        ],
      }
    case "modular_grid":
      return {
        conceptName: `${brandName} Modular Signal`,
        coreIdea:
          "Turn workspace structure into a compact symbol by routing one clear signal through a disciplined modular grid.",
        silhouetteStrategy:
          "A square-first silhouette composed of modules with one visible route cutting across them.",
        constructionPrinciples: [
          "Use rounded modules with consistent internal spacing.",
          "Let one routed stroke create the directional emphasis.",
          "Avoid overcrowding; the grid should read instantly at app-icon scale.",
          "Keep the overall silhouette balanced and architectural.",
        ],
        wordmarkDirection:
          "Use a restrained sans wordmark with quiet spacing so the system reads product-grade, not playful.",
        colorStrategy:
          "Default to monochrome or one dark neutral plus one structural accent. Color should clarify hierarchy, not create novelty.",
        avoidMotifs: [
          "stars",
          "mascots",
          "glassmorphism",
          "3D depth tricks",
          "random abstract polygons",
        ],
      }
    case "monogram":
      return {
        conceptName: `${brandName} Monogram Frame`,
        coreIdea:
          "Build a signature-like monogram from mirrored stems and one decisive bridge so the identity feels authored rather than templated.",
        silhouetteStrategy:
          "Tall, framed, and centered with one elevated connector that creates instant recognition from the outer contour.",
        constructionPrinciples: [
          "Use two main stems with shared weight.",
          "Create one bridge that carries the tension and authorship.",
          "Keep counters open enough for small-size legibility.",
          "Avoid ornamental flourishes or calligraphic excess.",
        ],
        wordmarkDirection:
          "Pair the monogram with a precise, quiet wordmark that feels editorial and composed rather than decorative.",
        colorStrategy:
          "Lean on neutral contrast first; if an accent is added, use it to emphasize the bridge or signature moment only.",
        avoidMotifs: [
          "stars",
          "badges",
          "ribbons",
          "faux-luxury serif clichés",
        ],
      }
    case "celestial_mark":
      return {
        conceptName: `${brandName} Orbital Signal`,
        coreIdea:
          "Use a compact star only because the brief explicitly invokes celestial or spark language, then discipline it with an orbital system so it avoids generic startup symbolism.",
        silhouetteStrategy:
          "A star held inside a restrained orbit, with the orbit doing as much work as the star.",
        constructionPrinciples: [
          "Keep the star compact and geometrically tight.",
          "Use the orbit as the outer silhouette stabilizer.",
          "Do not add extra spark particles or celebratory fragments.",
          "Ensure the mark still reads clearly in monochrome.",
        ],
        wordmarkDirection:
          "Use a grounded sans wordmark so the icon remains the expressive element without becoming loud.",
        colorStrategy:
          "Use dark neutral structure with one luminous accent gradient only if necessary to support the celestial brief.",
        avoidMotifs: [
          "fireworks",
          "emoji-like sparkle clusters",
          "juvenile space illustrations",
        ],
      }
    case "wordmark_first":
    default:
      return {
        conceptName: `${brandName} Signal Wordmark`,
        coreIdea:
          "Lead with a distinctive wordmark and support it with a compact signal glyph extracted from its rhythm, alignment, and internal tension.",
        silhouetteStrategy:
          "A low, steady horizontal cadence with one notched vertical interruption that creates recognition without spectacle.",
        constructionPrinciples: [
          "Keep the wordmark as the main signature.",
          "Let the supporting glyph come from the same rhythm, not a separate mascot.",
          "Use one interruption or notch to create memorability.",
          "Preserve black-and-white clarity before any accent color is introduced.",
        ],
        wordmarkDirection:
          "Use a serifless, product-grade wordmark with carefully tuned spacing and at least one non-generic detail in a terminal, notch, or junction.",
        colorStrategy:
          "Stay monochrome-first; use accent color only to emphasize the structural interruption, never as a blanket fill.",
        avoidMotifs: [
          "stars",
          "stock startup badges",
          "AI brains",
          "overbuilt gradient ribbons",
        ],
      }
  }
}

export function buildPlanContext(planText: string, planJson: Record<string, unknown> | null) {
  const structured = planJson ?? parseJsonObject(planText)
  if (structured) {
    return JSON.stringify(structured, null, 2)
  }

  const withoutThinking = planText
    .replace(/<think>[\s\S]*?<\/think>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!withoutThinking) {
    return "No plan details available."
  }

  return withoutThinking.slice(0, 2000)
}

export function createFallbackBrandOutput(input: {
  prompt: string
  brandBrief?: Record<string, unknown>
  fallbackStrategy?: FallbackLogoStrategy
}): LogoBrandOutput {
  const wordmarkRaw = inferWordmark(input)
  const wordmark = escapeXml(wordmarkRaw || "init")
  const brandName = escapeXml(inferBrandName(input))
  const palette = pickPalette(input)
  const fallbackStrategy = input.fallbackStrategy ?? chooseFallbackLogoStrategy(input)
  const artDirection = buildFallbackArtDirection({
    prompt: input.prompt,
    brandBrief: input.brandBrief,
    fallbackStrategy,
    palette,
  })

  const iconSvg = buildIconSvg({
    brandName,
    defs: artDirection.iconDefs,
    inner: artDirection.iconInner,
  })

  const wordmarkSvg = buildWordmarkSvg({
    wordmark,
    primary: palette.primary,
    weight: artDirection.wordmarkWeight,
    letterSpacing: artDirection.wordmarkLetterSpacing,
  })

  const fullSvg = buildFullSvg({
    brandName,
    wordmark,
    defs: artDirection.iconDefs,
    inner: artDirection.iconInner,
    primary: palette.primary,
    weight: artDirection.wordmarkWeight,
    letterSpacing: artDirection.wordmarkLetterSpacing,
  })

  return {
    conceptName: artDirection.conceptName,
    rationaleMd: artDirection.rationaleMd,
    logoSvg: {
      full: fullSvg,
      icon: iconSvg,
      wordmark: wordmarkSvg,
    },
    colorPalette: {
      primary: palette.primary,
      secondary: palette.secondary,
      neutral: palette.neutral,
    },
    typography: {
      headingFont: DISPLAY_FONT,
      bodyFont: BODY_FONT,
    },
    brandGuidelines: artDirection.brandGuidelines,
  }
}

export function createFallbackPosterOutput(input: {
  prompt: string
  brandBrief?: Record<string, unknown>
  brandOutput: LogoBrandOutput
}): LogoPosterOutput {
  const wordmark = escapeXml(inferWordmark(input))
  const colorPalette = asRecord(input.brandOutput.colorPalette)
  const primary = asString(colorPalette?.primary) ?? "#00D4FF"
  const secondary = asString(colorPalette?.secondary) ?? "#14F1D9"
  const neutral = asString(colorPalette?.neutral) ?? "#0F172A"
  const fallbackStrategy = chooseFallbackLogoStrategy(input)

  const centralMotif =
    fallbackStrategy === "relay_loop"
      ? [
          `<path d="M370 620C370 472 488 360 636 360" fill="none" stroke="${neutral}" stroke-width="42" stroke-linecap="round"/>`,
          `<path d="M830 620C830 768 712 880 564 880" fill="none" stroke="${primary}" stroke-width="42" stroke-linecap="round"/>`,
          `<path d="M478 620H722" fill="none" stroke="${secondary}" stroke-width="28" stroke-linecap="round"/>`,
          `<circle cx="600" cy="620" r="18" fill="${secondary}"/>`,
        ].join("")
      : fallbackStrategy === "modular_grid"
      ? [
          `<rect x="330" y="350" width="160" height="160" rx="38" fill="none" stroke="${neutral}" stroke-width="26"/>`,
          `<rect x="536" y="350" width="160" height="160" rx="38" fill="none" stroke="${neutral}" stroke-width="26"/>`,
          `<rect x="330" y="556" width="160" height="160" rx="38" fill="none" stroke="${neutral}" stroke-width="26"/>`,
          `<rect x="536" y="556" width="160" height="160" rx="38" fill="none" stroke="${neutral}" stroke-width="26"/>`,
          `<path d="M410 620H586V430" fill="none" stroke="${primary}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`,
          `<circle cx="513" cy="620" r="16" fill="${secondary}"/>`,
        ].join("")
      : fallbackStrategy === "monogram"
      ? [
          `<path d="M430 360V900" fill="none" stroke="${neutral}" stroke-width="38" stroke-linecap="round"/>`,
          `<path d="M770 360V900" fill="none" stroke="${neutral}" stroke-width="38" stroke-linecap="round"/>`,
          `<path d="M430 560L600 420L770 560" fill="none" stroke="${primary}" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>`,
          `<path d="M515 770H685" fill="none" stroke="${secondary}" stroke-width="30" stroke-linecap="round"/>`,
        ].join("")
      : fallbackStrategy === "celestial_mark"
      ? [
          `<circle cx="600" cy="580" r="208" fill="none" stroke="${neutral}" stroke-width="20" opacity="0.18"/>`,
          `<path d="${createStarPath({
            cx: 600,
            cy: 560,
            outerRadius: 178,
            innerRadius: 82,
          })}" fill="${primary}" opacity="0.9"/>`,
          `<path d="M410 770Q602 468 818 496" fill="none" stroke="${secondary}" stroke-width="24" stroke-linecap="round" opacity="0.82"/>`,
        ].join("")
      : [
          `<rect x="320" y="470" width="560" height="110" rx="55" fill="none" stroke="${neutral}" stroke-width="28"/>`,
          `<path d="M420 700H780" fill="none" stroke="${primary}" stroke-width="28" stroke-linecap="round"/>`,
          `<path d="M600 470V840" fill="none" stroke="${secondary}" stroke-width="28" stroke-linecap="round"/>`,
        ].join("")

  const posterSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" role="img" aria-label="brand poster">',
    "<defs>",
    '<linearGradient id="posterWash" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="#F8FAFC"/>`,
    `<stop offset="100%" stop-color="#E2E8F0"/>`,
    "</linearGradient>",
    "</defs>",
    '<rect width="1200" height="1600" fill="url(#posterWash)"/>',
    '<rect x="92" y="92" width="1016" height="1416" rx="42" fill="none" stroke="#CBD5E1" stroke-width="4"/>',
    centralMotif,
    `<text x="120" y="1232" font-size="182" font-weight="760" letter-spacing="1.6" fill="${neutral}" font-family="${DISPLAY_FONT}">${wordmark}</text>`,
    `<text x="124" y="1310" font-size="34" font-weight="500" letter-spacing="3.2" fill="${primary}" font-family="${BODY_FONT}">IDENTITY FALLBACK / BRIEF-AWARE SYSTEM</text>`,
    "</svg>",
  ].join("")

  return {
    posterSvg,
    rationaleMd:
      "Fallback poster reuses the same brief-aware motif family as the logo fallback so the composition stays coherent even when the generative poster stage fails.",
    philosophyMd:
      "Structural geometry, restrained contrast, and one clear conceptual motif preserve coherence while keeping the fallback artifact calm and legible.",
  }
}

function getLegacyBrandVariant(raw: Record<string, unknown>) {
  if (asRecordArray(raw.variants).length > 0) {
    return asRecordArray(raw.variants)[0] ?? null
  }
  if (asRecordArray(raw.logoVariants).length > 0) {
    return asRecordArray(raw.logoVariants)[0] ?? null
  }
  if (asRecordArray(raw.concepts).length > 0) {
    return asRecordArray(raw.concepts)[0] ?? null
  }
  return null
}

function getLegacyPosterVariant(raw: Record<string, unknown>) {
  if (asRecordArray(raw.variants).length > 0) {
    return asRecordArray(raw.variants)[0] ?? null
  }
  if (asRecordArray(raw.posterVariants).length > 0) {
    return asRecordArray(raw.posterVariants)[0] ?? null
  }
  if (asRecordArray(raw.posters).length > 0) {
    return asRecordArray(raw.posters)[0] ?? null
  }
  return null
}

export function normalizeBrandOutput(raw: Record<string, unknown> | null): LogoBrandOutput {
  if (!raw) {
    throw new Error("Brand designer returned empty output")
  }

  const root = asRecord(raw.brand) ?? asRecord(raw.output) ?? raw

  const source =
    asRecord(root.logoSvg ?? root.logo ?? root.svg) ||
    asString(root.conceptName) ||
    asString(root.rationaleMd)
      ? root
      : (getLegacyBrandVariant(root) ?? root)

  const logoSvgValue = source.logoSvg ?? source.logo ?? source.svg
  const logoSvgRecord = asRecord(logoSvgValue)
  const fullSvg =
    asString(logoSvgRecord?.full) ??
    asString(logoSvgRecord?.primary) ??
    asString(logoSvgValue) ??
    ""

  const normalized = logoBrandOutputSchema.safeParse({
    conceptName:
      asString(source.conceptName) ??
      asString(source.name) ??
      asString(source.title) ??
      "Primary Concept",
    rationaleMd:
      asString(source.rationaleMd) ??
      asString(source.rationale) ??
      asString(source.description) ??
      "No rationale provided.",
    logoSvg: {
      full: fullSvg,
      // Keep backward compatibility for old runs that only had full SVG.
      icon: asString(logoSvgRecord?.icon) ?? fullSvg,
      wordmark: asString(logoSvgRecord?.wordmark) ?? fullSvg,
    },
    colorPalette: asRecord(source.colorPalette) ?? undefined,
    typography: asRecord(source.typography) ?? undefined,
    brandGuidelines:
      asString(root.brandGuidelines) ??
      asString(source.brandGuidelines) ??
      asString(root.summaryGuidelines) ??
      asString(root.guidelines) ??
      undefined,
  })

  if (!normalized.success) {
    throw new Error(
      "Brand output must include conceptName, rationaleMd, and valid logoSvg.full/icon/wordmark"
    )
  }

  if (
    !isLikelySvg(normalized.data.logoSvg.full) ||
    !isLikelySvg(normalized.data.logoSvg.icon) ||
    !isLikelySvg(normalized.data.logoSvg.wordmark)
  ) {
    throw new Error("Brand output must contain complete SVG markup for full/icon/wordmark")
  }

  return normalized.data
}

export function normalizePosterOutput(raw: Record<string, unknown> | null): LogoPosterOutput {
  if (!raw) {
    throw new Error("Poster designer returned empty output")
  }

  const root = asRecord(raw.poster) ?? asRecord(raw.output) ?? raw

  const source =
    asString(root.posterSvg) || asString(root.svg) || asString(root.poster)
      ? root
      : (getLegacyPosterVariant(root) ?? root)

  const normalized = logoPosterOutputSchema.safeParse({
    posterSvg:
      asString(source.posterSvg) ??
      asString(source.svg) ??
      asString(source.poster) ??
      "",
    rationaleMd:
      asString(source.rationaleMd) ??
      asString(source.rationale) ??
      asString(source.description) ??
      undefined,
    philosophyMd:
      asString(root.philosophyMd) ??
      asString(root.philosophy) ??
      asString(root.designPhilosophy) ??
      undefined,
  })

  if (!normalized.success) {
    throw new Error("Poster output must include a valid posterSvg")
  }

  if (!isLikelySvg(normalized.data.posterSvg)) {
    throw new Error("Poster output must contain complete SVG markup")
  }

  return normalized.data
}

export function errorToMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return "Unknown error"
}
