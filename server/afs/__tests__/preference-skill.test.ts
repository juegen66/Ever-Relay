import { beforeEach, describe, expect, it, vi } from "vitest"

const upsertSkill = vi.fn()

vi.mock("../skill", () => ({
  afsSkillService: {
    upsertSkill,
  },
}))

import { AFS } from "../afs"
import {
  buildBestExamplesDir,
  buildPreferenceCandidatesDir,
  buildPreferenceProfilePath,
  buildPreferredWorkstyleSkillPath,
  PREFERRED_WORKSTYLE_SKILL_NAME,
} from "../preference-skill"

describe("preference skill helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds canonical Desktop and scoped paths", () => {
    expect(buildPreferenceProfilePath("Desktop")).toBe("Desktop/Memory/user/preference-profile")
    expect(buildPreferenceCandidatesDir("Canvas")).toBe(
      "Desktop/Canvas/Memory/note/preference-candidates"
    )
    expect(buildBestExamplesDir("Logo")).toBe(
      "Desktop/Logo/Memory/note/best-examples"
    )
    expect(buildPreferredWorkstyleSkillPath("VibeCoding")).toBe(
      `Desktop/VibeCoding/Skill/${PREFERRED_WORKSTYLE_SKILL_NAME}`
    )
  })
})

describe("preference skill writes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards skill metadata when writing preferred-workstyle through AFS", async () => {
    upsertSkill.mockResolvedValue({
      id: "skill-1",
      userId: "u1",
      agentId: null,
      scope: "Canvas",
      name: PREFERRED_WORKSTYLE_SKILL_NAME,
      description: "Canvas workstyle guidance",
      triggerWhen: "当任务涉及 Canvas 风格偏好时",
      tags: ["preference", "workstyle", "canvas"],
      content: "# Preferred Workstyle\n- Use tidy labels",
      version: 1,
      isActive: true,
      priority: 40,
      metadata: { source: "test" },
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
      updatedAt: new Date("2026-03-22T00:00:00.000Z"),
    })

    const afs = new AFS()

    const result = await afs.write(
      "u1",
      buildPreferredWorkstyleSkillPath("Canvas"),
      "# Preferred Workstyle\n- Use tidy labels",
      {
        tags: ["preference", "workstyle", "canvas"],
        metadata: {
          description: "Canvas workstyle guidance",
          triggerWhen: "当任务涉及 Canvas 风格偏好时",
          priority: 40,
          agentId: null,
          source: "test",
        },
      }
    )

    expect(result.path).toBe(buildPreferredWorkstyleSkillPath("Canvas"))
    expect(result.metadata?.description).toBe("Canvas workstyle guidance")
    expect(upsertSkill).toHaveBeenCalledWith("u1", {
      agentId: null,
      scope: "Canvas",
      name: PREFERRED_WORKSTYLE_SKILL_NAME,
      description: "Canvas workstyle guidance",
      triggerWhen: "当任务涉及 Canvas 风格偏好时",
      tags: ["preference", "workstyle", "canvas"],
      content: "# Preferred Workstyle\n- Use tidy labels",
      priority: 40,
      metadata: {
        description: "Canvas workstyle guidance",
        triggerWhen: "当任务涉及 Canvas 风格偏好时",
        priority: 40,
        agentId: null,
        source: "test",
      },
    })
  })
})
