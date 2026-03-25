import { describe, expect, it } from "vitest"

import {
  chooseFallbackLogoStrategy,
  createFallbackBrandOutput,
  createFallbackConceptBlueprint,
} from "@/server/mastra/inngest/functions/logo-design/utils"

describe("logo fallback strategy", () => {
  it("chooses a relay-aware fallback instead of the old fixed star", () => {
    const strategy = chooseFallbackLogoStrategy({
      prompt:
        "Design a logo for everrelay, an AI workspace platform about relay, handoff, modular collaboration, monochrome clarity, and no gradients.",
      brandBrief: {
        brandName: "everrelay",
        avoid: ["Gradients"],
      },
    })

    const fallback = createFallbackBrandOutput({
      prompt:
        "Design a logo for everrelay, an AI workspace platform about relay, handoff, modular collaboration, monochrome clarity, and no gradients.",
      brandBrief: {
        brandName: "everrelay",
        avoid: ["Gradients"],
      },
      fallbackStrategy: strategy,
    })

    expect(strategy).toBe("relay_loop")
    expect(fallback.conceptName).toContain("Relay")
    expect(fallback.rationaleMd).not.toContain("five-point star")
  })

  it("keeps celestial fallback opt-in only when the brief explicitly asks for it", () => {
    const strategy = chooseFallbackLogoStrategy({
      prompt:
        "Create a stellar spark logo for Nova, leaning into celestial energy and a star-like hero mark.",
      brandBrief: {
        brandName: "Nova",
      },
    })

    const blueprint = createFallbackConceptBlueprint({
      prompt:
        "Create a stellar spark logo for Nova, leaning into celestial energy and a star-like hero mark.",
      brandBrief: {
        brandName: "Nova",
      },
      fallbackStrategy: strategy,
    })

    expect(strategy).toBe("celestial_mark")
    expect(blueprint.coreIdea.toLowerCase()).toContain("celestial")
  })
})
