import { request } from "@/lib/api"
import type {
  RemoveBackgroundParams,
  RemoveBackgroundResponse,
} from "@/shared/contracts/image-processing"

export type { RemoveBackgroundParams, RemoveBackgroundResponse }

export const imageProcessingApi = {
  removeBackground(imageDataUrl: string) {
    const body: RemoveBackgroundParams = { imageDataUrl }
    return request.post<RemoveBackgroundResponse, RemoveBackgroundParams>(
      "/image-processing/remove-background",
      body,
      { timeout: 60_000 }
    )
  },
}

