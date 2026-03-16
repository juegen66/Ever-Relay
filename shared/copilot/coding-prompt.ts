import { DESKTOP_COPILOT_CODING_PROMPT_EVENT } from "./constants"

export interface CodingPromptPayload {
  appId: string
  threadId: string
  message: string
}

export function dispatchCodingPromptToCopilot(payload: CodingPromptPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<CodingPromptPayload>(DESKTOP_COPILOT_CODING_PROMPT_EVENT, {
      detail: payload,
    })
  )
}
