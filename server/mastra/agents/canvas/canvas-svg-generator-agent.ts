import { Agent } from "@mastra/core/agent"
import { z } from "zod"

import model from "@/server/mastra/model"

export const CANVAS_SVG_GENERATOR_AGENT_ID = "canvas_svg_generator_agent"

export const canvasSvgGenerationOutputSchema = z.object({
  svg: z.string().trim().min(1),
  summary: z.string().trim().optional(),
})

export const canvasSvgGeneratorAgent = new Agent({
  id: CANVAS_SVG_GENERATOR_AGENT_ID,
  name: "Canvas SVG Generator",
  model: model.lzmodel4oMini,
  instructions: [
    "You generate original SVG artwork for the EverRelay Canvas app.",
    "Return structured output only.",
    "The svg field must contain one complete standalone <svg>...</svg> document.",
    "The SVG must be genuinely generated from the user request, not a placeholder card or prompt text dump.",
    "Use the requested width, height, and viewBox exactly.",
    "Prefer rich vector compositions with multiple shapes, paths, groups, and gradients when helpful.",
    "Use text only when the user explicitly asks for text, lettering, a label, or typography.",
    "Keep the output compatible with common SVG renderers such as Fabric.js.",
    "Allowed elements: svg, g, defs, linearGradient, radialGradient, stop, rect, circle, ellipse, path, polygon, polyline, line, text, tspan, clipPath.",
    "Do not use script, style, foreignObject, iframe, object, embed, audio, video, image, use, filter, mask, pattern, animation, or external resources.",
    "Do not reference external fonts, external CSS, remote URLs, data URLs, or raster images.",
    "Do not wrap the SVG in markdown fences or prose.",
  ].join("\n"),
})
