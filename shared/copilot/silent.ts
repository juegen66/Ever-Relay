import { DESKTOP_COPILOT_SILENT_EVENT } from "./constants"

export interface SilentCopilotMessagePayload {
  message: string
  followUp?: boolean
  resetAfterRun?: boolean
}

export function dispatchSilentCopilotMessage(payload: SilentCopilotMessagePayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<SilentCopilotMessagePayload>(DESKTOP_COPILOT_SILENT_EVENT, {
      detail: payload,
    })
  )
}
