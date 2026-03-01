import { DESKTOP_COPILOT_BRAND_BRIEF_EVENT } from "./constants"

export interface BrandBriefPayload {
  message: string
}

export function dispatchBrandBriefToCopilot(payload: BrandBriefPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<BrandBriefPayload>(DESKTOP_COPILOT_BRAND_BRIEF_EVENT, {
      detail: payload,
    })
  )
}
