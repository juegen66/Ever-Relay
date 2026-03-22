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

import {
  SKILL_TEST_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import { WORKER_AGENT_ID } from "@/server/mastra/agents/shared/worker-agent"
import {
  classifyParallelRequest,
} from "@/server/mastra/workflows/parallel-workflow/complexity"
import {
  buildParallelSynthesis,
  finalizeParallelTaskReport,
  getExecutableParallelTasks,
  normalizeParallelTaskAgentId,
} from "@/server/mastra/workflows/parallel-workflow/helpers"
import {
  getParallelWorkflowSourceConfig,
} from "@/server/mastra/workflows/parallel-workflow/registry"

const skillTestConfig = getParallelWorkflowSourceConfig(SKILL_TEST_AGENT_ID)!

describe("parallel workflow helpers", () => {
  it("selects only dependency-unblocked tasks", () => {
    const plan = {
      tasks: [
        {
          id: "T1",
          name: "Load skills",
          agentId: SKILL_TEST_AGENT_ID,
          dependsOn: [],
          location: "Desktop",
          prerequisites: "",
          description: "Load skills",
          acceptanceCriteria: ["skills loaded"],
          validation: "",
        },
        {
          id: "T2",
          name: "Audit scopes",
          agentId: SKILL_TEST_AGENT_ID,
          dependsOn: ["T1"],
          location: "Desktop",
          prerequisites: "",
          description: "Audit scopes",
          acceptanceCriteria: ["scope audit completed"],
          validation: "",
        },
      ],
    }

    expect(getExecutableParallelTasks(plan, []).map((task) => task.id)).toEqual(["T1"])
    expect(getExecutableParallelTasks(plan, ["T1"]).map((task) => task.id)).toEqual(["T2"])
  })

  it("normalizes disallowed task agents back to the configured default", () => {
    expect(
      normalizeParallelTaskAgentId(
        {
          id: "T1",
          name: "Bad task",
          agentId: "unknown_agent",
          dependsOn: [],
          location: "",
          prerequisites: "",
          description: "desc",
          acceptanceCriteria: ["done"],
          validation: "",
        },
        skillTestConfig.allowedTaskAgentIds,
        skillTestConfig.defaultTaskAgentId
      )
    ).toBe(WORKER_AGENT_ID)
  })

  it("finalizes worker reports with task defaults", () => {
    expect(
      finalizeParallelTaskReport(
        {
          id: "T3",
          name: "Summarize",
          agentId: SKILL_TEST_AGENT_ID,
          dependsOn: [],
          location: "",
          prerequisites: "",
          description: "desc",
          acceptanceCriteria: ["done"],
          validation: "",
        },
        {
          status: "done",
          summary: "summary",
        }
      )
    ).toEqual({
      taskId: "T3",
      taskName: "Summarize",
      status: "done",
      summary: "summary",
    })
  })

  it("classifies complex requests with multiple diagnostic signals", () => {
    const classification = classifyParallelRequest(
      "请帮我跨多个 scope 验证 skill 是否能正确加载、激活并输出一个诊断报告，同时比较 Desktop 和 Canvas 的可见 skill。",
      skillTestConfig
    )

    expect(classification.isComplex).toBe(true)
    expect(classification.score).toBeGreaterThanOrEqual(2)
  })

  it("builds a concise synthesis from reports", () => {
    const synthesis = buildParallelSynthesis(
      {
        tasks: [
          {
            id: "T1",
            name: "Step 1",
            agentId: SKILL_TEST_AGENT_ID,
            dependsOn: [],
            location: "",
            prerequisites: "",
            description: "desc",
            acceptanceCriteria: ["done"],
            validation: "",
          },
        ],
      },
      ["T1"],
      [
        {
          taskId: "T1",
          taskName: "Step 1",
          status: "done",
          summary: "Verified Desktop skills.",
        },
      ]
    )

    expect(synthesis).toContain("Completed 1/1 tasks")
    expect(synthesis).toContain("Verified Desktop skills")
  })
})
