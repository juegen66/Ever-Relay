export const DESKTOP_COPILOT_AGENT = "main_agent"
export const LOGO_COPILOT_AGENT = "logo_agent"
export const CODING_COPILOT_AGENT = "coding_agent"
export const THIRD_PARTY_COPILOT_AGENT = "third_party_agent"
export const PREDICTION_AGENT_ID = "prediction_agent"
export const DESKTOP_COPILOT_ENDPOINT = "/api/copilotkit"
export const DESKTOP_PREDICTION_ENDPOINT = "/api/copilotkit/predict"

/** When false, the background prediction agent is disabled: no `/api/copilotkit/predict` traffic. */
export const DESKTOP_PREDICTION_ENABLED = false
export const DESKTOP_COPILOT_SILENT_CHAT_ID = "desktop-copilot-silent"
export const DESKTOP_PREDICTION_CHAT_ID = "desktop-prediction-silent"
export const DESKTOP_COPILOT_SILENT_EVENT = "cloudos:copilot:silent-send"
export const DESKTOP_COPILOT_BRAND_BRIEF_EVENT = "cloudos:copilot:brand-brief"
export const DESKTOP_COPILOT_CODING_PROMPT_EVENT = "cloudos:copilot:coding-prompt"
export const DESKTOP_COPILOT_PREDICTION_ACTION_EVENT = "cloudos:copilot:prediction-action"
