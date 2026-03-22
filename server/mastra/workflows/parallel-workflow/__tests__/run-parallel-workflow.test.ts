import { RequestContext } from "@mastra/core/request-context"
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
import { runParallelWorkflow } from "@/server/mastra/workflows/parallel-workflow"

describe("runParallelWorkflow", () => {
  it("does not route simple requests", async () => {
    const getWorkflow = vi.fn()

    const result = await runParallelWorkflow({
      mastra: {
        getWorkflow,
      } as never,
      request: "列出可用 skills",
      sourceAgentId: SKILL_TEST_AGENT_ID,
      requestContext: new RequestContext([["userId", "u1"]]),
    })

    expect(result.routed).toBe(false)
    expect(result.status).toBe("not_routed")
    expect(getWorkflow).not.toHaveBeenCalled()
  })

  it("runs the registered workflow for complex requests and returns state", async () => {
    const start = vi.fn().mockResolvedValue({
      status: "success",
      result: {
        synthesis: "Completed 2/2 tasks.",
      },
      state: {
        plan: {
          tasks: [
            {
              id: "T1",
              name: "Load",
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
        completedTaskIds: ["T1"],
        allReports: [
          {
            taskId: "T1",
            taskName: "Load",
            status: "done",
            summary: "Loaded skills.",
          },
        ],
      },
    })
    const createRun = vi.fn().mockResolvedValue({ start })
    const getWorkflow = vi.fn().mockReturnValue({ createRun })

    const result = await runParallelWorkflow({
      mastra: {
        getWorkflow,
      } as never,
      request:
        "请跨多个 scope 验证 skill 是否能正确加载和激活，并输出完整诊断报告。",
      sourceAgentId: SKILL_TEST_AGENT_ID,
      requestContext: new RequestContext([["userId", "u1"]]),
    })

    expect(result.routed).toBe(true)
    expect(result.status).toBe("success")
    expect(result.synthesis).toContain("Completed 2/2 tasks")
    expect(result.completedTaskIds).toEqual(["T1"])
    expect(createRun).toHaveBeenCalled()
    expect(start).toHaveBeenCalled()
  })
})
