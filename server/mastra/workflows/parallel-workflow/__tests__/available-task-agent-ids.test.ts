import { beforeEach, describe, expect, it, vi } from "vitest"

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

const { listParallelWorkflowRuntimeAgentIds } = vi.hoisted(() => ({
  listParallelWorkflowRuntimeAgentIds: vi.fn(),
}))

vi.mock("@/server/modules/agent-activity/agent-registry.service", () => ({
  agentRegistryService: {
    listParallelWorkflowRuntimeAgentIds,
  },
}))

import {
  PARALLEL_PLANNER_AGENT_ID,
  SKILL_TEST_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import { WORKER_AGENT_ID } from "@/server/mastra/agents/shared/worker-agent"
import {
  collectRuntimeAgentIds,
  loadParallelTaskAgentIds,
  resolveParallelTaskAgentIds,
} from "@/server/mastra/workflows/parallel-workflow/available-task-agent-ids"
import {
  getParallelWorkflowSourceConfig,
} from "@/server/mastra/workflows/parallel-workflow/registry"

const skillTestConfig = getParallelWorkflowSourceConfig(SKILL_TEST_AGENT_ID)!

describe("available parallel task agent ids", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("collects runtime agent ids from registry keys and agent ids", () => {
    expect(
      collectRuntimeAgentIds({
        listAgents: () => ({
          main_agent: { id: "main_agent" },
          canvas_registry_key: { id: "canvas_agent" },
        }),
      })
    ).toEqual(["main_agent", "canvas_registry_key", "canvas_agent"])
  })

  it("prefers DB-registered agent ids and filters them to runtime-available agents", () => {
    expect(
      resolveParallelTaskAgentIds({
        config: skillTestConfig,
        registeredAgentIds: [
          "canvas_agent",
          PARALLEL_PLANNER_AGENT_ID,
          "missing_agent",
        ],
        runtimeAgentIds: [
          "canvas_agent",
          WORKER_AGENT_ID,
          SKILL_TEST_AGENT_ID,
        ],
      })
    ).toEqual(["canvas_agent", WORKER_AGENT_ID, SKILL_TEST_AGENT_ID])
  })

  it("falls back to static config when the DB lookup fails", async () => {
    listParallelWorkflowRuntimeAgentIds.mockRejectedValueOnce(new Error("relation does not exist"))

    await expect(
      loadParallelTaskAgentIds(skillTestConfig, {
        listAgents: () => ({
          [WORKER_AGENT_ID]: { id: WORKER_AGENT_ID },
        }),
      })
    ).resolves.toEqual([WORKER_AGENT_ID])
  })
})
