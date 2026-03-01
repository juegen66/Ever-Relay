import { request } from "@/lib/api"
import type {
  CreateLogoDesignParams,
  CreateLogoDesignResponseData,
  LogoDesignAsset,
  LogoDesignRun,
} from "@/shared/contracts/logo-design"

export type {
  CreateLogoDesignParams,
  CreateLogoDesignResponseData,
  LogoDesignAsset,
  LogoDesignRun,
}

export const logoDesignApi = {
  triggerDesign(params: CreateLogoDesignParams) {
    return request.post<CreateLogoDesignResponseData, CreateLogoDesignParams>(
      "/logo-designs",
      params
    )
  },

  getDesignStatus(runId: string) {
    return request.get<LogoDesignRun>(`/logo-designs/${runId}`)
  },

  listDesigns() {
    return request.get<LogoDesignRun[]>("/logo-designs")
  },

  getAssets(runId: string) {
    return request.get<LogoDesignAsset[]>(`/logo-designs/${runId}/assets`)
  },

  /**
   * Fetches raw asset content (SVG, Markdown, etc). Use fetch() directly for binary/raw responses:
   * fetch(`/api/logo-designs/${runId}/assets/${assetId}`) then response.text()
   */
  getAssetUrl(runId: string, assetId: string) {
    return `/api/logo-designs/${runId}/assets/${assetId}`
  },
}
