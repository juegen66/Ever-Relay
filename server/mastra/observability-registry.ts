import {
  DefaultExporter,
  Observability,
  SamplingStrategyType,
  SensitiveDataFilter,
} from "@mastra/observability"

import type { ObservabilityExporter } from "@mastra/core/observability"

function buildSampling() {
  const raw = process.env.MASTRA_TRACE_SAMPLE_RATIO
  if (raw === undefined || raw === "") {
    return { type: SamplingStrategyType.ALWAYS as const }
  }
  const probability = Math.min(1, Math.max(0, Number(raw)))
  if (!Number.isFinite(probability)) {
    return { type: SamplingStrategyType.ALWAYS as const }
  }
  return { type: SamplingStrategyType.RATIO as const, probability }
}

const exporters: ObservabilityExporter[] = [new DefaultExporter()]

/** Traces → Postgres table `mastra_ai_spans` (DefaultExporter only, no cloud). */
export const mastraObservability = new Observability({
  configs: {
    default: {
      serviceName: process.env.MASTRA_OBSERVABILITY_SERVICE_NAME ?? "cloudos",
      sampling: buildSampling(),
      exporters,
      spanOutputProcessors: [new SensitiveDataFilter()],
    },
  },
})
