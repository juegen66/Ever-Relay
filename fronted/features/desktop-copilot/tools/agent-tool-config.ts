import {
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

/** Agent → tool groups for that agent. Add new agent by adding one line here. */
export const AGENT_TOOL_GROUPS: Record<string, readonly string[]> = {
  [DESKTOP_COPILOT_AGENT]: ["core", "canvas", "textedit", "build", "coding-apps", "hitl", "handoff"],
  [CODING_COPILOT_AGENT]: ["core", "coding-apps", "coding", "handoff"],
  [LOGO_COPILOT_AGENT]: ["core", "logo", "handoff"],
}
