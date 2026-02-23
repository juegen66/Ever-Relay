import { serverConfig } from "@/server/core/config"

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg"
const MAX_IMAGE_DATA_URL_LENGTH = 15 * 1024 * 1024

export class ImageProcessingError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "ImageProcessingError"
    this.status = status
  }
}

function parseBase64DataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const matched = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!matched) {
    throw new ImageProcessingError("imageDataUrl must be a valid base64 image data URL", 400)
  }

  return {
    mimeType: matched[1],
    base64: matched[2],
  }
}

async function parseRemoveBgErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null) as
      | { errors?: Array<{ title?: string; code?: string }> }
      | null

    const firstError = payload?.errors?.[0]
    if (firstError?.title) {
      return firstError.title
    }
  }

  const text = await response.text().catch(() => "")
  return text.trim() || "Background removal failed"
}

export class ImageProcessingService {
  async removeImageBackground(dataUrl: string): Promise<string> {
    const apiKey = serverConfig.imageProcessing.removeBgApiKey
    if (!apiKey) {
      throw new ImageProcessingError("REMOVE_BG_API_KEY is not configured", 503)
    }

    if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new ImageProcessingError("Image payload is too large", 413)
    }

    const { mimeType, base64 } = parseBase64DataUrl(dataUrl)
    if (!mimeType.startsWith("image/")) {
      throw new ImageProcessingError("Only image files are supported", 400)
    }

    const body = new URLSearchParams({
      image_file_b64: base64,
      size: "auto",
      format: "png",
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45_000)

    try {
      const response = await fetch(REMOVE_BG_ENDPOINT, {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = await parseRemoveBgErrorMessage(response)
        throw new ImageProcessingError(message, response.status)
      }

      const outputBuffer = Buffer.from(await response.arrayBuffer())
      return `data:image/png;base64,${outputBuffer.toString("base64")}`
    } catch (error) {
      if (error instanceof ImageProcessingError) {
        throw error
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ImageProcessingError("Background removal timed out", 504)
      }
      throw new ImageProcessingError("Background removal failed", 502)
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export const imageProcessingService = new ImageProcessingService()
