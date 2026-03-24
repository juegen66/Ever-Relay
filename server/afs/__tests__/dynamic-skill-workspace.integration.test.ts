import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { afsSkillService } from "@/server/afs/skill"
import { DbSkillSource } from "@/server/afs/skill-source"
import { db } from "@/server/core/database"
import { afsSkill } from "@/server/db/schema"
import { createDynamicSkillWorkspace } from "@/server/mastra/workspace"
import {
  CANVAS_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  PREDICTION_AGENT_ID,
} from "@/shared/copilot/constants"
import {
  PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME,
  PREFERRED_WORKSTYLE_SKILL_NAME,
} from "@/server/afs/preference-skill"

const TEST_USER = "integration-test-dynamic-skill-workspace"
const DB_MARKER = `DB_SKILL_MARKER_${Date.now()}`

describe("dynamic skill workspace (integration)", () => {
  beforeEach(async () => {
    await db.delete(afsSkill).where(eq(afsSkill.userId, TEST_USER))
  })

  afterEach(async () => {
    await db.delete(afsSkill).where(eq(afsSkill.userId, TEST_USER))
  })

  it("loads active agent and global skills from afs_skill via workspace.skills", async () => {
    await afsSkillService.upsertSkill(TEST_USER, {
      agentId: DESKTOP_COPILOT_AGENT,
      scope: "Desktop",
      name: "db-agent-skill",
      description: "Desktop agent skill stored in afs_skill",
      triggerWhen: "当用户请求测试动态 skill 时",
      tags: ["integration", "desktop"],
      content: `# Agent Skill\n${DB_MARKER}`,
      priority: 10,
      metadata: { source: "integration-test" },
    })

    await afsSkillService.upsertSkill(TEST_USER, {
      scope: "Desktop",
      name: "db-global-skill",
      description: "Global skill stored in afs_skill",
      tags: ["integration", "global"],
      content: "# Global Skill\nvisible-to-all-agents",
      priority: 5,
    })

    await afsSkillService.upsertSkill(TEST_USER, {
      agentId: PREDICTION_AGENT_ID,
      scope: "Desktop",
      name: "db-other-agent-skill",
      description: "Should not be visible in main_agent workspace",
      tags: ["integration", "prediction"],
      content: "# Prediction Skill\nshould-not-appear",
      priority: 20,
    })

    const inactiveSkill = await afsSkillService.upsertSkill(TEST_USER, {
      agentId: DESKTOP_COPILOT_AGENT,
      scope: "Desktop",
      name: "db-inactive-skill",
      description: "Inactive skill should not be visible",
      tags: ["integration", "inactive"],
      content: "# Inactive Skill\nshould-not-appear",
      priority: 30,
    })

    await afsSkillService.toggleSkill(inactiveSkill.id, false)

    const metasFromService = await afsSkillService.listSkillMeta(TEST_USER, {
      agentId: DESKTOP_COPILOT_AGENT,
    })

    expect(metasFromService.map((skill) => skill.name)).toContain("db-agent-skill")
    expect(metasFromService.map((skill) => skill.name)).toContain("db-global-skill")
    expect(metasFromService.map((skill) => skill.name)).not.toContain("db-other-agent-skill")
    expect(metasFromService.map((skill) => skill.name)).not.toContain("db-inactive-skill")

    const source = new DbSkillSource({
      userId: TEST_USER,
      agentId: DESKTOP_COPILOT_AGENT,
    })

    const sourceEntries = await source.readdir("/db-skills")

    expect(sourceEntries.map((entry) => entry.name)).toContain("db-agent-skill")
    expect(sourceEntries.map((entry) => entry.name)).toContain("db-global-skill")

    const workspace = createDynamicSkillWorkspace(TEST_USER, DESKTOP_COPILOT_AGENT)

    expect(workspace.skills).toBeDefined()
    const metas = await workspace.skills!.list()
    const metaNames = metas.map((skill) => skill.name)

    expect(metaNames).toContain("db-agent-skill")
    expect(metaNames).toContain("db-global-skill")
    expect(metaNames).not.toContain("db-other-agent-skill")
    expect(metaNames).not.toContain("db-inactive-skill")

    const skill = await workspace.skills!.get("db-agent-skill")

    expect(skill).not.toBeNull()
    expect(skill?.name).toBe("db-agent-skill")
    expect(skill?.description).toBe("Desktop agent skill stored in afs_skill")
    expect(skill?.instructions).toContain(DB_MARKER)
  })

  it("includes Desktop global meta skills alongside scope-specific preferred-workstyle", async () => {
    await afsSkillService.upsertSkill(TEST_USER, {
      scope: "Desktop",
      name: PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME,
      description: "Global meta skill for preference learning",
      tags: ["preference", "global"],
      content: "# Preference Memory Maintainer\nUse AFS consistently",
      priority: 20,
    })

    await afsSkillService.upsertSkill(TEST_USER, {
      scope: "Canvas",
      name: PREFERRED_WORKSTYLE_SKILL_NAME,
      description: "Current canvas workstyle guidance",
      triggerWhen: "当任务涉及 Canvas 用户偏好时",
      tags: ["preference", "canvas"],
      content: "# Preferred Workstyle\n- Prefer compact labels",
      priority: 40,
    })

    const canvasMetas = await afsSkillService.listSkillMeta(TEST_USER, {
      agentId: CANVAS_COPILOT_AGENT,
      scope: "Canvas",
    })

    expect(canvasMetas.map((skill) => skill.name)).toContain(
      PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME
    )
    expect(canvasMetas.map((skill) => skill.name)).toContain(
      PREFERRED_WORKSTYLE_SKILL_NAME
    )
  })
})
