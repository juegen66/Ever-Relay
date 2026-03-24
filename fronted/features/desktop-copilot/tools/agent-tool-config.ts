import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  THIRD_PARTY_COPILOT_AGENT,
} from "@/shared/copilot/constants"

/** Agent → tool groups for that agent. Add new agent by adding one line here. */
export const AGENT_TOOL_GROUPS: Record<string, readonly string[]> = {
  [DESKTOP_COPILOT_AGENT]: ["core", "artifact", "textedit", "build", "coding-apps", "hitl", "handoff"],
  [CANVAS_COPILOT_AGENT]: ["core", "canvas", "handoff"],
  [CODING_COPILOT_AGENT]: ["core", "coding-apps", "coding", "handoff"],
  [LOGO_COPILOT_AGENT]: ["core", "logo", "handoff"],
  [THIRD_PARTY_COPILOT_AGENT]: ["core", "third-party", "handoff"],
}
