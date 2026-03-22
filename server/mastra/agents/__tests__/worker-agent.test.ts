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
  workerAgent,
  WORKER_AGENT_ID,
} from "@/server/mastra/agents/shared/worker-agent"

describe("worker agent registration", () => {
  it("registers workerAgent in the mastra agents map", () => {
    expect(agents[WORKER_AGENT_ID]).toBe(workerAgent)
    expect(workerAgent.id).toBe(WORKER_AGENT_ID)
    expect(workerAgent.name).toBe("Worker Agent")
  })
})
