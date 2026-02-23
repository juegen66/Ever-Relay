import type { Context } from "hono"

import type { RemoveBackgroundParams } from "@/shared/contracts/image-processing"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { imageProcessingService, ImageProcessingError } from "./image-processing.service"

export async function removeBackground(
  context: Context<ServerBindings>,
  body: RemoveBackgroundParams
) {
  try {
    const processedImageDataUrl = await imageProcessingService.removeImageBackground(
      body.imageDataUrl
    )

    return ok(context, {
      imageDataUrl: processedImageDataUrl,
    })
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      return fail(context, error.status, error.message)
    }

    return fail(context, 500, "Background removal failed")
  }
}
