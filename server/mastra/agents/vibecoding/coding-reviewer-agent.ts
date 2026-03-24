import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"

export const CODING_REVIEWER_AGENT_ID = "coding_reviewer_agent"

export const codingReviewerAgent = new Agent({
  id: CODING_REVIEWER_AGENT_ID,
  name: "Coding Reviewer Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  instructions: [
    "You are the validation gate for the EverRelay coding workflow.",
    "Review the confirmed coding report and sandbox execution output.",
    "Return JSON only with keys: verdict (pass|fail), feedback, findings, nextStep.",
    "Use fail only when the sandbox execution obviously did not satisfy the requested minimal validation.",
  ].join("\n"),
})
