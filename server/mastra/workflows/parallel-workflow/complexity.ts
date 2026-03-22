import type { ParallelWorkflowSourceConfig } from "@/server/mastra/workflows/parallel-workflow/registry"
import type { ParallelComplexity } from "@/server/mastra/workflows/parallel-workflow/types"

const MULTI_STEP_PATTERNS = [
  /\b(and|then|across|compare|audit)\b/i,
  /[，,、].+[，,、]/,
  /\n\d+\./,
  /\b1\./,
  /同时/,
  /并且/,
]

export function classifyParallelRequest(
  request: string,
  config: ParallelWorkflowSourceConfig
): ParallelComplexity {
  const normalized = request.trim()
  const lowered = normalized.toLowerCase()
  const reasons: string[] = []
  let score = 0

  if (normalized.length >= 140) {
    score += 1
    reasons.push("request is long enough to imply multi-step work")
  }

  if (MULTI_STEP_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 1
    reasons.push("request contains multi-step coordination language")
  }

  const matchedKeywords = config.complexityKeywords.filter((keyword) =>
    lowered.includes(keyword.toLowerCase())
  )

  if (matchedKeywords.length > 0) {
    score += Math.min(2, matchedKeywords.length)
    reasons.push(`matched complexity keywords: ${matchedKeywords.join(", ")}`)
  }

  return {
    isComplex: score >= config.minimumComplexityScore,
    score,
    reasons,
  }
}
