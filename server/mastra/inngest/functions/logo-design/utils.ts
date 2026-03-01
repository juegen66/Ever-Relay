import {
  logoBrandOutputSchema,
  logoPosterOutputSchema,
  type LogoBrandOutput,
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
  const paletteCandidates = [
    { primary: "#00D4FF", secondary: "#14F1D9", neutral: "#0F172A" },
    { primary: "#00C2FF", secondary: "#22C55E", neutral: "#111827" },
    { primary: "#06B6D4", secondary: "#FF6B6B", neutral: "#0B1020" },
  ]

  return (
    paletteCandidates.find(
      (palette) =>
        !avoidColor ||
        ![palette.primary, palette.secondary, palette.neutral]
          .map((item) => item.toLowerCase())
          .includes(avoidColor)
    ) ?? paletteCandidates[0]
  )
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
}): LogoBrandOutput {
  const wordmarkRaw = inferWordmark(input)
  const wordmark = escapeXml(wordmarkRaw || "init")
  const brandName = escapeXml(inferBrandName(input))
  const palette = pickPalette(input)
  const iconStarPath = createStarPath({
    cx: 128,
    cy: 128,
    outerRadius: 84,
    innerRadius: 36,
  })
  const fullStarPath = createStarPath({
    cx: 96,
    cy: 96,
    outerRadius: 62,
    innerRadius: 27,
  })

  const iconSvg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${brandName} icon">`,
    "<defs>",
    '<linearGradient id="logoIconGradient" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${palette.primary}"/>`,
    `<stop offset="100%" stop-color="${palette.secondary}"/>`,
    "</linearGradient>",
    "</defs>",
    `<rect width="256" height="256" rx="56" fill="${palette.neutral}"/>`,
    `<path d="${iconStarPath}" fill="url(#logoIconGradient)"/>`,
    "</svg>",
  ].join("")

  const wordmarkSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 120" role="img" aria-label="wordmark">',
    '<rect width="560" height="120" fill="none"/>',
    `<text x="0" y="82" font-size="76" font-weight="700" letter-spacing="1.5" fill="${palette.primary}" font-family="Avenir Next, Poppins, Inter, Arial, sans-serif">${wordmark}</text>`,
    "</svg>",
  ].join("")

  const fullSvg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 192" role="img" aria-label="${brandName} full logo">`,
    "<defs>",
    '<linearGradient id="logoFullGradient" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${palette.primary}"/>`,
    `<stop offset="100%" stop-color="${palette.secondary}"/>`,
    "</linearGradient>",
    "</defs>",
    `<rect x="0" y="0" width="192" height="192" rx="44" fill="${palette.neutral}"/>`,
    `<path d="${fullStarPath}" fill="url(#logoFullGradient)"/>`,
    `<text x="236" y="126" font-size="96" font-weight="700" letter-spacing="1.4" fill="${palette.primary}" font-family="Avenir Next, Poppins, Inter, Arial, sans-serif">${wordmark}</text>`,
    "</svg>",
  ].join("")

  return {
    conceptName: "Neon Launch Star",
    rationaleMd:
      "Fallback concept generated to keep workflow resilient: geometric five-point star + clean wordmark for a modern tech-startup feeling.",
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
      headingFont: "Avenir Next",
      bodyFont: "Inter",
    },
    brandGuidelines:
      "Use icon for app/avatar contexts, wordmark for tight horizontal spaces, and full logo for landing and marketing headers.",
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
  const posterStarPath = createStarPath({
    cx: 600,
    cy: 560,
    outerRadius: 198,
    innerRadius: 86,
  })

  const posterSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" role="img" aria-label="brand poster">',
    "<defs>",
    '<linearGradient id="posterBg" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${neutral}"/>`,
    `<stop offset="100%" stop-color="#030712"/>`,
    "</linearGradient>",
    '<linearGradient id="posterStar" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0%" stop-color="${primary}"/>`,
    `<stop offset="100%" stop-color="${secondary}"/>`,
    "</linearGradient>",
    "</defs>",
    '<rect width="1200" height="1600" fill="url(#posterBg)"/>',
    `<path d="${posterStarPath}" fill="url(#posterStar)" opacity="0.95"/>`,
    `<text x="120" y="1240" font-size="188" font-weight="800" letter-spacing="2" fill="${primary}" font-family="Avenir Next, Poppins, Inter, Arial, sans-serif">${wordmark}</text>`,
    `<text x="124" y="1320" font-size="46" font-weight="500" letter-spacing="3" fill="#E2E8F0" font-family="Inter, Arial, sans-serif">START FAST. SHIP BRIGHT.</text>`,
    "</svg>",
  ].join("")

  return {
    posterSvg,
    rationaleMd:
      "Fallback poster keeps the same star-first visual language and high-contrast startup energy as the logo system.",
    philosophyMd:
      "Simple geometry + bright contrast communicates speed, clarity, and confidence for young technology brands.",
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
