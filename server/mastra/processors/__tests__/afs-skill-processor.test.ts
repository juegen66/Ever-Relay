import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/afs/skill", () => ({
  afsSkillService: {
    listSkillMeta: vi.fn(),
    loadSkillContent: vi.fn(),
    loadSkillByName: vi.fn(),
  },
}))

vi.mock("@/server/afs/skill-reference", () => ({
  afsSkillReferenceService: {
    listReferenceMeta: vi.fn(),
    loadReferenceContent: vi.fn(),
    upsertReference: vi.fn(),
  },
}))

import { afsSkillService } from "@/server/afs/skill"
import { afsSkillReferenceService } from "@/server/afs/skill-reference"
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

const referenceMeta = {
  id: "ref-1",
  skillId: "skill-1",
  userId: "user-1",
  name: "meeting-note-template",
  title: "Meeting Note Template",
  description: "Structured format for meeting notes",
  contentFormat: "markdown" as const,
  loadWhen: "when writing detailed meeting notes",
  priority: 10,
  isActive: true,
  metadata: {},
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
}

describe("AfsSkillProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("injects reference manifests and loads references on demand", async () => {
    vi.mocked(afsSkillService.listSkillMeta).mockResolvedValue([skillMeta])
    vi.mocked(afsSkillService.loadSkillContent).mockResolvedValue({
      name: "preferred-workstyle",
      content: "# Preferred Workstyle\nKeep the guide concise.",
    })
    vi.mocked(afsSkillService.loadSkillByName).mockResolvedValue({
      id: "skill-1",
      userId: "user-1",
      agentId: null,
      scope: "Canvas",
      name: "preferred-workstyle",
      description: "Current canvas workstyle guidance",
      triggerWhen: "当任务涉及 Canvas 用户偏好时",
      tags: ["preference", "canvas"],
      content: "# Preferred Workstyle\nKeep the guide concise.",
      version: 1,
      isActive: true,
      priority: 40,
      metadata: {},
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    } as never)
    vi.mocked(afsSkillReferenceService.listReferenceMeta).mockResolvedValue([referenceMeta])
    vi.mocked(afsSkillReferenceService.loadReferenceContent).mockResolvedValue({
      ...referenceMeta,
      content: "# Meeting Notes\n- Decisions\n- Action items",
    })
    vi.mocked(afsSkillReferenceService.upsertReference).mockResolvedValue({
      id: "ref-2",
      skillId: "skill-1",
      userId: "user-1",
      name: "research-note-template",
      title: "Research Note Template",
      description: "Deeper research-note structure",
      content: "# Research Notes\n- Questions\n- Sources",
      contentFormat: "markdown",
      loadWhen: "when writing research notes",
      priority: 20,
      isActive: true,
      metadata: {},
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    } as never)

    const processor = new AfsSkillProcessor({
      userId: "user-1",
      agentId: "canvas_agent",
      scope: "Canvas",
    })

    const step0Args = createStepArgs(0)
    const step0Messages = step0Args.messageList
    const step0 = await processor.processInputStep(step0Args.args as never)

    expect(step0.tools).toHaveProperty("skill-activate")
    expect(step0.tools).toHaveProperty("skill-load-reference")
    expect(step0.tools).toHaveProperty("skill-upsert-reference")

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
    const step1 = await processor.processInputStep(step1Args.args as never)

    expect(
      step1Messages.messages.some((message) =>
        message.content.includes("## Available References")
      )
    ).toBe(true)
    expect(
      step1Messages.messages.some((message) =>
        message.content.includes("meeting-note-template")
      )
    ).toBe(true)

    const referenceTool = step1.tools?.["skill-load-reference"] as {
      execute: (
        input: { skillName: string; referenceName: string },
        context: unknown
      ) => Promise<{ success: boolean }>
    }
    const referenceResult = await referenceTool.execute(
      {
        skillName: "preferred-workstyle",
        referenceName: "meeting-note-template",
      },
      {} as never
    )

    expect(referenceResult.success).toBe(true)

    const upsertTool = step1.tools?.["skill-upsert-reference"] as {
      execute: (
        input: {
          skillName: string
          referenceName: string
          title: string
          description: string
          content: string
          loadWhen?: string
          priority?: number
        },
        context: unknown
      ) => Promise<{ success: boolean }>
    }
    const upsertResult = await upsertTool.execute(
      {
        skillName: "preferred-workstyle",
        referenceName: "research-note-template",
        title: "Research Note Template",
        description: "Deeper research-note structure",
        content: "# Research Notes\n- Questions\n- Sources",
        loadWhen: "when writing research notes",
        priority: 20,
      },
      {} as never
    )

    expect(upsertResult.success).toBe(true)
    expect(afsSkillReferenceService.upsertReference).toHaveBeenCalledWith(
      "user-1",
      "skill-1",
      {
        name: "research-note-template",
        title: "Research Note Template",
        description: "Deeper research-note structure",
        content: "# Research Notes\n- Questions\n- Sources",
        loadWhen: "when writing research notes",
        priority: 20,
        contentFormat: undefined,
      }
    )

    const step2Args = createStepArgs(2)
    const step2Messages = step2Args.messageList
    await processor.processInputStep(step2Args.args as never)

    expect(
      step2Messages.messages.some((message) =>
        message.content.includes("# Activated Skill References")
      )
    ).toBe(true)
    expect(
      step2Messages.messages.some((message) =>
        message.content.includes("# Meeting Notes")
      )
    ).toBe(true)
  })
})
