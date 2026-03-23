import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/afs/skill", () => ({
  afsSkillService: {
    listSkillMeta: vi.fn(),
    loadSkillContent: vi.fn(),
  },
}))

import { afsSkillService } from "@/server/afs/skill"
import { AfsSkillProcessor } from "../afs-skill-processor"

function createMessageList() {
  const messages: Array<{ role: string; content: string }> = []

  return {
    messages,
    addSystem(message: { role: string; content: string }) {
      messages.push(message)
      return this
    },
  }
}

function createStepArgs(stepNumber: number) {
  const messageList = createMessageList()

  return {
    messageList,
    args: {
      messageList: messageList as never,
      messages: [],
      tools: {},
      stepNumber,
      steps: [],
      systemMessages: [],
      state: {},
      model: {} as never,
      retryCount: 0,
      abort: new AbortController().signal,
    },
  }
}

const skillMeta = {
  id: "skill-1",
  agentId: null,
  scope: "Canvas",
  name: "preferred-workstyle",
  description: "Current canvas workstyle guidance",
  triggerWhen: "当任务涉及 Canvas 用户偏好时",
  tags: ["preference", "canvas"],
  version: 1,
  isActive: true,
  priority: 40,
  metadata: {},
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
}

describe("AfsSkillProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("injects available skills and activates on demand", async () => {
    vi.mocked(afsSkillService.listSkillMeta).mockResolvedValue([skillMeta])
    vi.mocked(afsSkillService.loadSkillContent).mockResolvedValue({
      name: "preferred-workstyle",
      content: "# Preferred Workstyle\nKeep the guide concise.",
    })

    const processor = new AfsSkillProcessor({
      userId: "user-1",
      agentId: "canvas_agent",
      scope: "Canvas",
    })

    const step0Args = createStepArgs(0)
    const step0Messages = step0Args.messageList
    const step0 = await processor.processInputStep(step0Args.args as never)

    expect(step0.tools).toHaveProperty("skill-activate")
    expect(step0.tools).not.toHaveProperty("skill-load-reference")
    expect(step0.tools).not.toHaveProperty("skill-upsert-reference")

    expect(
      step0Messages.messages.some((message) =>
        message.content.includes("# Available Skills")
      )
    ).toBe(true)

    const activateTool = step0.tools?.["skill-activate"] as {
      execute: (input: { name: string }, context: unknown) => Promise<{ success: boolean }>
    }
    const activateResult = await activateTool.execute(
      { name: "preferred-workstyle" },
      {} as never
    )

    expect(activateResult.success).toBe(true)

    const step1Args = createStepArgs(1)
    const step1Messages = step1Args.messageList
    await processor.processInputStep(step1Args.args as never)

    expect(
      step1Messages.messages.some((message) =>
        message.content.includes("# Activated Skills")
      )
    ).toBe(true)
    expect(
      step1Messages.messages.some((message) =>
        message.content.includes("# Preferred Workstyle")
      )
    ).toBe(true)
  })
})
