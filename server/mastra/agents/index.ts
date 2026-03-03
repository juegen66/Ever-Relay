import { desktopAgent } from "./desktop-agent"
import { plannerAgent, PLANNER_AGENT_ID } from "./planner-agent"
import { builderAgent, BUILDER_AGENT_ID } from "./builder-agent"
import { reviewerAgent, REVIEWER_AGENT_ID } from "./reviewer-agent"
import { brandBriefAgent, BRAND_BRIEF_AGENT_ID } from "./brand-brief-agent"
import { brandDesignerAgent, BRAND_DESIGNER_AGENT_ID } from "./brand-designer-agent"
import { posterDesignerAgent, POSTER_DESIGNER_AGENT_ID } from "./poster-designer-agent"
import { logoCopilotAgent } from "./logo-copilot-agent"
import {
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

export const agents = {
  [DESKTOP_COPILOT_AGENT]: desktopAgent,
  [LOGO_COPILOT_AGENT]: logoCopilotAgent,
  [PLANNER_AGENT_ID]: plannerAgent,
  [BUILDER_AGENT_ID]: builderAgent,
  [REVIEWER_AGENT_ID]: reviewerAgent,
  [BRAND_BRIEF_AGENT_ID]: brandBriefAgent,
  [BRAND_DESIGNER_AGENT_ID]: brandDesignerAgent,
  [POSTER_DESIGNER_AGENT_ID]: posterDesignerAgent,
}
