import {
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import { brandBriefAgent, BRAND_BRIEF_AGENT_ID } from "./brand-brief-agent"
import { brandDesignerAgent, BRAND_DESIGNER_AGENT_ID } from "./brand-designer-agent"
import { builderAgent, BUILDER_AGENT_ID } from "./builder-agent"
import {
  codingCopilotAgent,
} from "./coding-copilot-agent"
import {
  codingReviewerAgent,
  CODING_REVIEWER_AGENT_ID,
} from "./coding-reviewer-agent"
import {
  codingWorkerAgent,
  CODING_WORKER_AGENT_ID,
} from "./coding-worker-agent"
import {
  contextCompressionAgent,
  CONTEXT_COMPRESSION_AGENT_ID,
} from "./context-compression-agent"
import { desktopAgent } from "./desktop-agent"
import { logoCopilotAgent } from "./logo-copilot-agent"
import { plannerAgent, PLANNER_AGENT_ID } from "./planner-agent"
import { posterDesignerAgent, POSTER_DESIGNER_AGENT_ID } from "./poster-designer-agent"
import { predictionAgent, PREDICTION_AGENT_ID } from "./prediction-agent"
import { reviewerAgent, REVIEWER_AGENT_ID } from "./reviewer-agent"


export const agents = {
  [DESKTOP_COPILOT_AGENT]: desktopAgent,
  [LOGO_COPILOT_AGENT]: logoCopilotAgent,
  [CODING_COPILOT_AGENT]: codingCopilotAgent,
  [PREDICTION_AGENT_ID]: predictionAgent,
  [CONTEXT_COMPRESSION_AGENT_ID]: contextCompressionAgent,
  [PLANNER_AGENT_ID]: plannerAgent,
  [BUILDER_AGENT_ID]: builderAgent,
  [REVIEWER_AGENT_ID]: reviewerAgent,
  [CODING_WORKER_AGENT_ID]: codingWorkerAgent,
  [CODING_REVIEWER_AGENT_ID]: codingReviewerAgent,
  [BRAND_BRIEF_AGENT_ID]: brandBriefAgent,
  [BRAND_DESIGNER_AGENT_ID]: brandDesignerAgent,
  [POSTER_DESIGNER_AGENT_ID]: posterDesignerAgent,
}
