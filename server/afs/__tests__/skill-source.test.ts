import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../skill", () => ({
  afsSkillService: {
    listSkillMeta: vi.fn(),
    loadSkillByName: vi.fn(),
  },
}))

vi.mock("../skill-reference", () => ({
  afsSkillReferenceService: {
    listReferenceMeta: vi.fn(),
    loadReferenceByName: vi.fn(),
  },
}))

import { afsSkillService } from "../skill"
import { afsSkillReferenceService } from "../skill-reference"
import { DbSkillSource } from "../skill-source"

const baseMeta = {
  id: "skill-1",
  agentId: "desktop_copilot",
  scope: "Desktop",
  name: "message-html-builder",
  description: "Build HTML artifacts",
  triggerWhen: "当用户请求生成 HTML 卡片时",
  tags: ["artifact", "html"],
  version: 1,
  isActive: true,
  priority: 10,
  metadata: {},
  createdAt: "2026-03-19T08:00:00.000Z",
  updatedAt: "2026-03-19T09:00:00.000Z",
}

describe("DbSkillSource", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(afsSkillReferenceService.listReferenceMeta).mockResolvedValue([])
  })

  it("lists skill metadata without loading full skill content", async () => {
    vi.mocked(afsSkillService.listSkillMeta).mockResolvedValue([
      baseMeta,
      {
        ...baseMeta,
        id: "skill-2",
        name: "prediction-report-builder",
        description: "Build prediction reports",
        priority: 5,
      },
    ])

    const source = new DbSkillSource({
      userId: "user-1",
      agentId: "desktop_copilot",
    })

    await expect(source.readdir("/db-skills")).resolves.toEqual([
      { name: "message-html-builder", type: "directory" },
      { name: "prediction-report-builder", type: "directory" },
    ])
    await expect(source.exists("/db-skills/message-html-builder")).resolves.toBe(true)
    await expect(source.readdir("/db-skills/message-html-builder")).resolves.toEqual([
      { name: "SKILL.md", type: "file" },
    ])

    expect(afsSkillService.listSkillMeta).toHaveBeenCalledWith("user-1", {
      agentId: "desktop_copilot",
    })
    expect(afsSkillService.listSkillMeta).toHaveBeenCalledTimes(1)
    expect(afsSkillService.loadSkillByName).not.toHaveBeenCalled()
  })

  it("loads the full skill only when SKILL.md is read", async () => {
    vi.mocked(afsSkillService.loadSkillByName).mockResolvedValue({
      id: "skill-1",
      userId: "user-1",
      agentId: "desktop_copilot",
      scope: "Desktop",
      name: "message-html-builder",
      description: "Build HTML artifacts",
      triggerWhen: "当用户请求生成 HTML 卡片时",
      tags: ["artifact", "html"],
      content: "# Rules\nUse HTML",
      version: 2,
      isActive: true,
      priority: 10,
      metadata: {},
      createdAt: new Date("2026-03-19T08:00:00.000Z"),
      updatedAt: new Date("2026-03-19T09:00:00.000Z"),
    } as never)

    const source = new DbSkillSource({
      userId: "user-1",
      agentId: "desktop_copilot",
    })

    await expect(source.readFile("/db-skills/message-html-builder/SKILL.md")).resolves.toBe([
      "---",
      "name: message-html-builder",
      'description: "Build HTML artifacts"',
      "version: 2",
      "priority: 10",
      "",
      'trigger_when: "当用户请求生成 HTML 卡片时"',
      "",
      'tags: ["artifact","html"]',
      "---",
      "# Rules\nUse HTML",
    ].join("\n"))

    expect(afsSkillService.loadSkillByName).toHaveBeenCalledWith(
      "user-1",
      "message-html-builder",
      "desktop_copilot",
      undefined
    )
  })

  it("rejects non-SKILL.md reads and missing skills", async () => {
    const source = new DbSkillSource({
      userId: "user-1",
      agentId: "desktop_copilot",
    })

    await expect(source.readFile("/db-skills/message-html-builder/README.md")).rejects.toThrow(
      "DbSkillSource: can only read SKILL.md or references/*.md files"
    )

    vi.mocked(afsSkillService.loadSkillByName).mockResolvedValue(null)

    await expect(source.readFile("/db-skills/missing-skill/SKILL.md")).rejects.toThrow(
      "DbSkillSource: skill not found: missing-skill"
    )
  })

  it("exposes and reads reference files under references/", async () => {
    vi.mocked(afsSkillService.listSkillMeta).mockResolvedValue([baseMeta])
    vi.mocked(afsSkillReferenceService.listReferenceMeta).mockResolvedValue([
      {
        id: "ref-1",
        skillId: "skill-1",
        userId: "user-1",
        name: "meeting-note-template",
        title: "Meeting Note Template",
        description: "Structured format for meeting notes",
        contentFormat: "markdown",
        loadWhen: "when writing detailed meeting notes",
        priority: 10,
        isActive: true,
        metadata: {},
        createdAt: "2026-03-20T08:00:00.000Z",
        updatedAt: "2026-03-20T09:00:00.000Z",
      },
    ])
    vi.mocked(afsSkillReferenceService.loadReferenceByName).mockResolvedValue({
      id: "ref-1",
      skillId: "skill-1",
      userId: "user-1",
      name: "meeting-note-template",
      title: "Meeting Note Template",
      description: "Structured format for meeting notes",
      content: "# Meeting Notes\n- Decisions\n- Action items",
      contentFormat: "markdown",
      loadWhen: "when writing detailed meeting notes",
      priority: 10,
      isActive: true,
      metadata: {},
      createdAt: new Date("2026-03-20T08:00:00.000Z"),
      updatedAt: new Date("2026-03-20T09:00:00.000Z"),
    } as never)

    const source = new DbSkillSource({
      userId: "user-1",
      agentId: "desktop_copilot",
    })

    await expect(source.readdir("/db-skills/message-html-builder")).resolves.toEqual([
      { name: "SKILL.md", type: "file" },
      { name: "references", type: "directory" },
    ])

    await expect(source.readdir("/db-skills/message-html-builder/references")).resolves.toEqual([
      { name: "meeting-note-template.md", type: "file" },
    ])

    await expect(
      source.readFile("/db-skills/message-html-builder/references/meeting-note-template.md")
    ).resolves.toBe("# Meeting Notes\n- Decisions\n- Action items")
  })
})
