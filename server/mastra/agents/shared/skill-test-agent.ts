import { Agent } from "@mastra/core/agent"

import { createAgentMemory } from "@/server/mastra/memory"
import model from "@/server/mastra/model"
import { AfsSkillProcessor } from "@/server/mastra/processors/afs-skill-processor"

export const SKILL_TEST_AGENT_ID = "skill_test_agent"
export const SKILL_TEST_DEFAULT_USER_ID =
  process.env.MASTRA_SKILL_TEST_USER_ID ?? "mastra-skill-test-user"

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
    "Do not invent hidden skills or claim activation succeeded unless the processor exposes that skill.",
    "Keep replies short and explicit so this agent is easy to use for manual testing.",
  ].join("\n"),
})
