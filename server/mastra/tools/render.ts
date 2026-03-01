import { createTool } from "@mastra/core/tools"
import { z } from "zod"

const renderSvgToPngInputSchema = z.object({
  svg: z.string().min(1).describe("SVG markup string"),
  width: z.number().int().min(120).max(2400).optional().default(1024),
  height: z.number().int().min(120).max(2400).optional().default(1024),
})

type RenderSvgToPngInput = z.infer<typeof renderSvgToPngInputSchema>

type SharpLike = (input: Buffer) => {
  resize: (width: number, height: number) => {
    png: () => {
      toBuffer: () => Promise<Buffer>
    }
  }
}

let sharpModulePromise: Promise<SharpLike> | null = null

async function loadSharp() {
  if (!sharpModulePromise) {
    sharpModulePromise = (
      new Function('return import("sharp")')() as Promise<{ default?: unknown }>
    )
      .then((mod) => {
        const sharpLike = (mod.default ?? mod) as unknown
        if (typeof sharpLike !== "function") {
          throw new Error("sharp is not available")
        }
        return sharpLike as SharpLike
      })
      .catch((error) => {
        sharpModulePromise = null
        throw error
      })
  }

  return sharpModulePromise
}

export async function renderSvgToPng(input: RenderSvgToPngInput) {
  const { svg, width, height } = input

  try {
    const sharp = await loadSharp()
    const pngBuffer = await sharp(Buffer.from(svg, "utf-8"))
      .resize(width, height)
      .png()
      .toBuffer()
    const pngBase64 = pngBuffer.toString("base64")

    return {
      ok: true as const,
      pngDataUrl: `data:image/png;base64,${pngBase64}`,
      pngBase64,
      width,
      height,
      sizeBytes: pngBuffer.byteLength,
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Unknown error"

    return {
      ok: false as const,
      width,
      height,
      error: `renderSvgToPng failed: ${message}`,
    }
  }
}

export const renderSvgToPngTool = createTool({
  id: "render_svg_to_png",
  description: "Render SVG string to PNG image. Returns base64 data URL.",
  inputSchema: renderSvgToPngInputSchema,
  execute: async (input) => renderSvgToPng(input),
})
