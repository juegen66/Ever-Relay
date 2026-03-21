import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  THIRD_PARTY_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import { canvasCopilotAgent } from "./canvas/canvas-copilot-agent"
import { brandBriefAgent, BRAND_BRIEF_AGENT_ID } from "./logo-studio/brand-brief-agent"
import { brandDesignerAgent, BRAND_DESIGNER_AGENT_ID } from "./logo-studio/brand-designer-agent"
import { logoCopilotAgent } from "./logo-studio/logo-copilot-agent"
import { posterDesignerAgent, POSTER_DESIGNER_AGENT_ID } from "./logo-studio/poster-designer-agent"
import {
  contextCompressionAgent,
  CONTEXT_COMPRESSION_AGENT_ID,
} from "./shared/context-compression-agent"
import { desktopAgent } from "./shared/desktop-agent"
import {
  memoryCuratorAgent,
  MEMORY_CURATOR_AGENT_ID,
} from "./shared/memory-curator-agent"
import { predictionAgent, PREDICTION_AGENT_ID } from "./shared/prediction-agent"
import { thirdPartyCopilotAgent } from "./third-party/third-party-copilot-agent"
import { skillTestAgent, SKILL_TEST_AGENT_ID } from "./shared/skill-test-agent"
import { builderAgent, BUILDER_AGENT_ID } from "./vibecoding/builder-agent"
import { codingCopilotAgent } from "./vibecoding/coding-copilot-agent"
import {
  codingReviewerAgent,
  CODING_REVIEWER_AGENT_ID,
} from "./vibecoding/coding-reviewer-agent"
import {
  codingWorkerAgent,
  CODING_WORKER_AGENT_ID,
} from "./vibecoding/coding-worker-agent"
import { plannerAgent, PLANNER_AGENT_ID } from "./vibecoding/planner-agent"
import { reviewerAgent, REVIEWER_AGENT_ID } from "./vibecoding/reviewer-agent"

export const agents = {
  [DESKTOP_COPILOT_AGENT]: desktopAgent,
  [CANVAS_COPILOT_AGENT]: canvasCopilotAgent,
  [LOGO_COPILOT_AGENT]: logoCopilotAgent,
  [CODING_COPILOT_AGENT]: codingCopilotAgent,
  [THIRD_PARTY_COPILOT_AGENT]: thirdPartyCopilotAgent,
  [PREDICTION_AGENT_ID]: predictionAgent,
  [CONTEXT_COMPRESSION_AGENT_ID]: contextCompressionAgent,
  [MEMORY_CURATOR_AGENT_ID]: memoryCuratorAgent,
  [PLANNER_AGENT_ID]: plannerAgent,
  [BUILDER_AGENT_ID]: builderAgent,
  [REVIEWER_AGENT_ID]: reviewerAgent,
  [SKILL_TEST_AGENT_ID]: skillTestAgent,
  [CODING_WORKER_AGENT_ID]: codingWorkerAgent,
  [CODING_REVIEWER_AGENT_ID]: codingReviewerAgent,
  [BRAND_BRIEF_AGENT_ID]: brandBriefAgent,
  [BRAND_DESIGNER_AGENT_ID]: brandDesignerAgent,
  [POSTER_DESIGNER_AGENT_ID]: posterDesignerAgent,
}
