/**
 * AfsSkillProcessor — Injects DB-backed skill summaries into the agent's
 * system messages via processInputStep, removing the need for the
 * DbSkillSource → Workspace skillSource chain.
 *
 * At step 0, fetches skill metadata from AfsSkillService and injects an
 * available-skills listing. On every step, if any skills have been activated
 * via the skill-activate tool, their full content is injected as well.
 */

import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import { afsSkillService } from "@/server/afs/skill"
import type { SkillMeta } from "@/server/afs/skill"

import type { ProcessInputStepArgs, Processor } from "@mastra/core/processors"
import type { AfsScope } from "@/server/db/schema"

export interface AfsSkillProcessorConfig {
  userId: string
  agentId?: string
  scope?: AfsScope
}

export class AfsSkillProcessor implements Processor<"afs-skill-processor"> {
  readonly id = "afs-skill-processor" as const
  readonly name = "AFS Skill Processor"

  private readonly userId: string
  private readonly agentId?: string
  private readonly scope?: AfsScope

  /** Cached skill metadata, refreshed at step 0 */
  private skillMetas: SkillMeta[] = []
  /** Set of skill names activated by the agent via tool call */
  private activatedSkills = new Set<string>()

  constructor(config: AfsSkillProcessorConfig) {
    this.userId = config.userId
    this.agentId = config.agentId
    this.scope = config.scope
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  private formatAvailableSkills(): string {
    if (this.skillMetas.length === 0) return ""

    const items = this.skillMetas.map(
      (s) => `- **${s.name}**: ${s.description}`
    )

    return [
      "# Available Skills",
      "",
      "Use the `skill-activate` tool to load a skill's full instructions before following them.",
      "",
      ...items,
    ].join("\n")
  }

  private async formatActivatedSkills(): Promise<string> {
    if (this.activatedSkills.size === 0) return ""

    const sections: string[] = []

    for (const name of this.activatedSkills) {
      const row = await afsSkillService.loadSkillByName(
        this.userId,
        name,
        this.agentId
      )
      if (!row) continue
      sections.push(
        `# Skill: ${row.name}\n\n${row.content}`
      )
    }

    if (sections.length === 0) return ""

    return [
      "# Activated Skills",
      "",
      sections.join("\n\n---\n\n"),
    ].join("\n")
  }

  // ---------------------------------------------------------------------------
  // Tool creation
  // ---------------------------------------------------------------------------

  private createSkillActivateTool() {
    const activatedSkills = this.activatedSkills
    const metas = () => this.skillMetas

    return createTool({
      id: "skill-activate",
      description:
        "Activate a skill to load its full instructions. You should activate skills proactively when they are relevant to the user's request without asking for permission first.",
      inputSchema: z.object({
        name: z.string().describe("The name of the skill to activate"),
      }),
      execute: async ({ name }) => {
        const available = metas()
        const match = available.find((s) => s.name === name)

        if (!match) {
          return {
            success: false,
            message: `Skill "${name}" not found. Available skills: ${available.map((s) => s.name).join(", ")}`,
          }
        }

        if (activatedSkills.has(name)) {
          return {
            success: true,
            message: `Skill "${name}" is already activated`,
          }
        }

        activatedSkills.add(name)
        console.warn(
          "\n[AFS Skill] ═══════════════════════════════════════\n" +
            `[AFS Skill] ✅ Activated skill: "${name}"\n` +
            "[AFS Skill] ═══════════════════════════════════════\n"
        )
        return {
          success: true,
          message: `Skill "${name}" activated successfully. The skill instructions are now available.`,
        }
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Processor interface
  // ---------------------------------------------------------------------------

  async processInputStep({ messageList, tools, stepNumber }: ProcessInputStepArgs) {
    // Refresh skill metadata on the first step
    if (stepNumber === 0) {
      this.skillMetas = await afsSkillService.listSkillMeta(this.userId, {
        agentId: this.agentId,
        scope: this.scope,
      })
      if (this.skillMetas.length > 0) {
        console.warn(
          "\n[AFS Skill] ═══════════════════════════════════════\n" +
            `[AFS Skill] 📋 Loaded ${this.skillMetas.length} skill(s): ${this.skillMetas.map((s) => s.name).join(", ")}\n` +
            "[AFS Skill] ═══════════════════════════════════════\n"
        )
      }
    }

    const hasSkills = this.skillMetas.length > 0

    // Inject available-skills listing
    if (hasSkills) {
      const listing = this.formatAvailableSkills()
      if (listing) {
        messageList.addSystem({ role: "system", content: listing })
      }
      messageList.addSystem({
        role: "system",
        content:
          'IMPORTANT: Skills are NOT tools. Do not call skill names directly. To use a skill, call the skill-activate tool with the skill name as the "name" parameter. When a user asks about a topic covered by an available skill, activate it immediately without asking for permission.',
      })
    }

    // Inject activated-skills content
    if (this.activatedSkills.size > 0) {
      const activated = await this.formatActivatedSkills()
      if (activated) {
        messageList.addSystem({ role: "system", content: activated })
      }
    }

    // Provide skill tools
    const skillTools: Record<string, unknown> = {}
    if (hasSkills) {
      const activateTool = this.createSkillActivateTool()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(activateTool as any).needsApprovalFn = () => false
      skillTools["skill-activate"] = activateTool
    }

    return {
      messageList,
      tools: { ...tools, ...skillTools },
    }
  }
}

/**
 * Factory — creates an AfsSkillProcessor from requestContext.
 * Use as a function in the `inputProcessors` array so it can read userId at runtime.
 */
export function createAfsSkillProcessor(config: AfsSkillProcessorConfig) {
  return new AfsSkillProcessor(config)
}
