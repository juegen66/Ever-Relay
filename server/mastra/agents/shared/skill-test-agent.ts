import { Agent } from "@mastra/core/agent"

import {
  SKILL_TEST_AGENT_ID,
  SKILL_TEST_DEFAULT_USER_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"
import { runParallelWorkflowTool } from "@/server/mastra/tools/parallel-workflow"

export {
  SKILL_TEST_AGENT_ID,
  SKILL_TEST_DEFAULT_USER_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"

export const skillTestAgent = new Agent({
  id: SKILL_TEST_AGENT_ID,
  name: "Skill Test Agent",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  inputProcessors: ({ requestContext }) => {
    const rawUserId = requestContext.get("userId")
    const userId = typeof rawUserId === "string" && rawUserId.length > 0
      ? rawUserId
      : SKILL_TEST_DEFAULT_USER_ID

    return [
      new AfsSkillProcessor({ userId, agentId: SKILL_TEST_AGENT_ID }),
    ]
  },
  instructions: [
    "You are a diagnostic agent used to verify DB-backed skills loaded from afs_skill.",
    "Your own agent id is skill_test_agent.",
    `If requestContext.userId is missing, use the fallback user id ${SKILL_TEST_DEFAULT_USER_ID}.`,
    "When the user asks you to verify or exercise a skill, first inspect the available skills.",
    "If the requested skill is available, call skill-activate with that skill name before following its instructions.",
    "If no matching skill is available, explain that clearly and include the skill names you can see.",
    "For simple skill-loading or single-skill questions, answer directly.",
    "If the request requires a multi-step diagnosis, cross-scope verification, or a synthesized report, call run_parallel_workflow with the user's request.",
    "When run_parallel_workflow returns routed=true, use its synthesis as the main answer instead of restating your own plan.",
    "Do not invent hidden skills or claim activation succeeded unless the processor exposes that skill.",
    "Keep replies short and explicit so this agent is easy to use for manual testing.",
  ].join("\n"),
  tools: {
    runParallelWorkflow: runParallelWorkflowTool,
  },
})
