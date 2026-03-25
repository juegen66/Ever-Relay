import { describe, expect, it, vi } from "vitest"

vi.mock("@/server/mastra/agents/logo-studio/brand-designer-agent", () => ({
  brandDesignerAgent: {
    generate: vi.fn(),
  },
}))

vi.mock("@/server/mastra/inngest/client", () => ({
  inngest: {
    send: vi.fn(),
  },
}))

vi.mock("@/server/mastra/inngest/request-context", () => ({
  createBuildRunRequestContext: vi.fn(),
}))

vi.mock("@/server/modules/logo-design/logo-design.service", () => ({
  logoDesignService: {
    getRunById: vi.fn(),
    markStage: vi.fn(),
    updateRun: vi.fn(),
    markFailed: vi.fn(),
  },
}))

import {
  analyzeConceptResponse,
  detectConceptTypeFromSvg,
} from "@/server/mastra/inngest/functions/logo-design/brand-design.function"

describe("logo brand concept normalization", () => {
  it("treats defs and transparent layout rects as valid wordmark-only markup", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 120">',
      "<defs>",
      '<linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#111827"/>',
      '<stop offset="100%" stop-color="#334155"/>',
      "</linearGradient>",
      "</defs>",
      '<rect width="640" height="120" fill="none"/>',
      '<text x="0" y="82" fill="url(#ink)" font-size="76">everrelay</text>',
      "</svg>",
    ].join("")

    expect(detectConceptTypeFromSvg(svg)).toBe("wordmark_only")
  })

  it("returns a specific validation hint when a required lockup type is missing", () => {
    const parsed = {
      logoConcepts: [
        {
          id: "icon",
          conceptType: "icon_only",
          conceptName: "Relay Icon",
          rationaleMd: "icon",
          logoSvg:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M10 10H200" stroke="#000" stroke-width="20"/></svg>',
        },
        {
          id: "full",
          conceptType: "icon_with_wordmark",
          conceptName: "Relay Full",
          rationaleMd: "full",
          logoSvg:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 120"><path d="M10 10H200" stroke="#000" stroke-width="20"/><text x="240" y="82">everrelay</text></svg>',
        },
      ],
      selectedConceptId: "full",
    }

    const result = analyzeConceptResponse(parsed)

    expect(result.normalized).toBeNull()
    expect(result.validationHint).toContain("wordmark_only")
  })
})
