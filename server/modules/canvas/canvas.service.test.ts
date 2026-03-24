import { beforeEach, describe, expect, it, vi } from "vitest"

const { generate } = vi.hoisted(() => ({
  generate: vi.fn(),
}))

vi.mock("@/server/mastra/agents/canvas/canvas-svg-generator-agent", () => ({
  canvasSvgGenerationOutputSchema: {
    parse: (value: unknown) => value,
  },
  canvasSvgGeneratorAgent: {
    generate,
  },
}))

vi.mock("@/server/mastra/model", () => ({
  default: {
    lzmodel4oMini: "mock-lzmodel",
  },
}))

import {
  CanvasService,
  CanvasSvgValidationError,
} from "@/server/modules/canvas/canvas.service"

describe("CanvasService.generateSvgCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("normalizes real model output into a full svg document", async () => {
    generate.mockResolvedValueOnce({
      object: {
        svg: [
          "```svg",
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<svg><rect x="40" y="40" width="220" height="120" rx="24" fill="#0f172a"/></svg>',
          "```",
        ].join("\n"),
      },
    })

    const result = await new CanvasService().generateSvgCode({
      prompt: "draw a dark rounded banner",
      width: 640,
      height: 360,
    })

    expect(result.width).toBe(640)
    expect(result.height).toBe(360)
    expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(result.svg).toContain('width="640"')
    expect(result.svg).toContain('height="360"')
    expect(result.svg).toContain('viewBox="0 0 640 360"')
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("repairs invalid model svg instead of falling back to a template", async () => {
    generate
      .mockResolvedValueOnce({
        object: {
          svg: "not an svg document",
        },
      })
      .mockResolvedValueOnce({
        object: {
          svg: '<svg><circle cx="240" cy="240" r="120" fill="#22c55e"/></svg>',
        },
      })

    const result = await new CanvasService().generateSvgCode({
      prompt: "make a green circle badge",
      width: 480,
      height: 480,
    })

    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate.mock.calls[1]?.[0]).toContain("Repair the SVG")
    expect(result.svg).toContain('viewBox="0 0 480 480"')
    expect(result.svg).toContain("<circle")
  })

  it("throws when both generation attempts are invalid", async () => {
    generate
      .mockResolvedValueOnce({
        object: {
          svg: "still not svg",
        },
      })
      .mockResolvedValueOnce({
        object: {
          svg: '<svg><script>alert("x")</script></svg>',
        },
      })

    await expect(
      new CanvasService().generateSvgCode({
        prompt: "draw a warning icon",
        width: 320,
        height: 320,
      })
    ).rejects.toBeInstanceOf(CanvasSvgValidationError)

    expect(generate).toHaveBeenCalledTimes(2)
  })
})
