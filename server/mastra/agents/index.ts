import { desktopAgent } from "./desktop-agent"
import { plannerAgent, PLANNER_AGENT_ID } from "./planner-agent"
import { builderAgent, BUILDER_AGENT_ID } from "./builder-agent"
import { reviewerAgent, REVIEWER_AGENT_ID } from "./reviewer-agent"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export const agents = {
  [DESKTOP_COPILOT_AGENT]: desktopAgent,
  [PLANNER_AGENT_ID]: plannerAgent,
  [BUILDER_AGENT_ID]: builderAgent,
  [REVIEWER_AGENT_ID]: reviewerAgent,
}
