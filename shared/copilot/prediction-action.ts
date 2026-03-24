import { DESKTOP_COPILOT_PREDICTION_ACTION_EVENT } from "./constants"

export interface PredictionActionPayload {
  message: string
}

export function dispatchPredictionActionToCopilot(payload: PredictionActionPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<PredictionActionPayload>(DESKTOP_COPILOT_PREDICTION_ACTION_EVENT, {
      detail: payload,
    })
  )
}
