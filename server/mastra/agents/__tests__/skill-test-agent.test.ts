import { describe, expect, it, vi } from "vitest"

vi.mock("@/server/core/database", () => ({
  pool: {},
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      afsMemory: { findFirst: vi.fn() },
      afsHistory: { findFirst: vi.fn() },
      afsSkill: { findFirst: vi.fn() },
    },
  },
}))

import { agents } from "@/server/mastra/agents"
import {
  skillTestAgent,
  SKILL_TEST_AGENT_ID,
} from "@/server/mastra/agents/shared/skill-test-agent"

describe("skill test agent registration", () => {
  it("registers skill_test_agent in the mastra agents map", () => {
    expect(agents[SKILL_TEST_AGENT_ID]).toBe(skillTestAgent)
    expect(skillTestAgent.id).toBe(SKILL_TEST_AGENT_ID)
    expect(skillTestAgent.name).toBe("Skill Test Agent")
  })

  it("keeps the skill test agent registered after parallel workflow integration", () => {
    expect(agents[SKILL_TEST_AGENT_ID]).toBeDefined()
  })
})
