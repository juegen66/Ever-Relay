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

import {
  PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME,
  PREFERRED_WORKSTYLE_SKILL_NAME,
} from "@/server/afs/preference-skill"
import { afsSkillReferenceService } from "@/server/afs/skill-reference"
import { afsSkillService } from "@/server/afs/skill"
import type { SkillMeta } from "@/server/afs/skill"
import type { SkillReferenceMeta } from "@/server/afs/skill-reference"

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
  /** Activated skill ids keep scope-correct resolution even when names repeat */
  private activatedSkillIds = new Set<string>()
  /** Loaded reference ids are injected only after explicit demand */
  private loadedReferenceIds = new Set<string>()
  /** Reference metadata cache keyed by skill id */
  private referenceMetas = new Map<string, SkillReferenceMeta[]>()

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

    const items = this.skillMetas.map((s) => {
      const trigger = s.triggerWhen ? ` Trigger: ${s.triggerWhen}.` : ""
      const tags = s.tags.length > 0 ? ` Tags: ${s.tags.join(", ")}.` : ""
      return `- **${s.name}**: ${s.description}${trigger}${tags}`
    })

    return [
      "# Available Skills",
      "",
      "Use the `skill-activate` tool to load a skill's full instructions before following them.",
      "",
      ...items,
    ].join("\n")
  }

  private async formatActivatedSkills(): Promise<string> {
    if (this.activatedSkillIds.size === 0) return ""

    const sections: string[] = []

    for (const skillId of this.activatedSkillIds) {
      const meta = this.skillMetas.find((skill) => skill.id === skillId)
      const content = await afsSkillService.loadSkillContent(skillId)
      if (!meta || !content) continue

      const referenceSection = await this.formatAvailableReferences(skillId)
      sections.push(
        `# Skill: ${meta.name}\n\n${content.content}${referenceSection}`
      )
    }

    if (sections.length === 0) return ""

    return [
      "# Activated Skills",
      "",
      sections.join("\n\n---\n\n"),
    ].join("\n")
  }

  private async getReferenceMetas(skillId: string): Promise<SkillReferenceMeta[]> {
    const cached = this.referenceMetas.get(skillId)
    if (cached) return cached

    const refs = (await afsSkillReferenceService.listReferenceMeta(this.userId, skillId)) ?? []
    this.referenceMetas.set(skillId, refs)
    return refs
  }

  private async formatAvailableReferences(skillId: string): Promise<string> {
    const refs = await this.getReferenceMetas(skillId)
    if (refs.length === 0) return ""

    const items = refs.map((reference) => {
      const loadWhen = reference.loadWhen ? ` Load when: ${reference.loadWhen}.` : ""
      return `- **${reference.name}** (${reference.title}): ${reference.description}.${loadWhen}`
    })

    return [
      "",
      "## Available References",
      "",
      ...items,
      "",
      "Use the `skill-load-reference` tool to load only the references you need.",
    ].join("\n")
  }

  private async formatLoadedReferences(): Promise<string> {
    if (this.loadedReferenceIds.size === 0) return ""

    const sections: string[] = []

    for (const referenceId of this.loadedReferenceIds) {
      const reference = await afsSkillReferenceService.loadReferenceContent(
        this.userId,
        referenceId
      )
      if (!reference) continue

      const skillName =
        this.skillMetas.find((skill) => skill.id === reference.skillId)?.name ??
        reference.skillId

      sections.push(
        `# Skill Reference: ${reference.title}\n\n` +
          `Source skill: ${skillName}\n` +
          `Reference name: ${reference.name}\n\n` +
          `${reference.content}`
      )
    }

    if (sections.length === 0) return ""

    return [
      "# Activated Skill References",
      "",
      sections.join("\n\n---\n\n"),
    ].join("\n")
  }

  // ---------------------------------------------------------------------------
  // Tool creation
  // ---------------------------------------------------------------------------

  private createSkillActivateTool() {
    const activatedSkillIds = this.activatedSkillIds
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

        if (activatedSkillIds.has(match.id)) {
          return {
            success: true,
            message: `Skill "${name}" is already activated`,
          }
        }

        activatedSkillIds.add(match.id)
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

  private createSkillLoadReferenceTool() {
    const activatedSkillIds = this.activatedSkillIds
    const loadedReferenceIds = this.loadedReferenceIds

    return createTool({
      id: "skill-load-reference",
      description:
        "Load one reference document for an already-activated skill. Use this when the active skill points to detailed templates, examples, or topic-specific guidance that should not be injected all at once.",
      inputSchema: z.object({
        skillName: z.string().describe("The activated skill that owns the reference"),
        referenceName: z.string().describe("The reference name shown under Available References"),
      }),
      execute: async ({ skillName, referenceName }) => {
        const skill = this.skillMetas.find(
          (meta) => meta.name === skillName && activatedSkillIds.has(meta.id)
        )

        if (!skill) {
          const activated = this.skillMetas
            .filter((meta) => activatedSkillIds.has(meta.id))
            .map((meta) => meta.name)

          return {
            success: false,
            message: activated.length > 0
              ? `Skill "${skillName}" is not activated. Activated skills: ${activated.join(", ")}`
              : "No skills are activated yet. Activate a skill before loading its references.",
          }
        }

        const refs = await this.getReferenceMetas(skill.id)
        const match = refs.find((reference) => reference.name === referenceName)

        if (!match) {
          return {
            success: false,
            message: refs.length > 0
              ? `Reference "${referenceName}" not found for skill "${skillName}". Available references: ${refs.map((reference) => reference.name).join(", ")}`
              : `Skill "${skillName}" has no available references.`,
          }
        }

        if (loadedReferenceIds.has(match.id)) {
          return {
            success: true,
            message: `Reference "${referenceName}" is already loaded for skill "${skillName}".`,
          }
        }

        loadedReferenceIds.add(match.id)
        console.warn(
          "\n[AFS Skill] ═══════════════════════════════════════\n" +
            `[AFS Skill] 📚 Loaded reference: "${referenceName}" for skill "${skillName}"\n` +
            "[AFS Skill] ═══════════════════════════════════════\n"
        )

        return {
          success: true,
          message: `Reference "${referenceName}" loaded for skill "${skillName}".`,
        }
      },
    })
  }

  private createSkillUpsertReferenceTool() {
    return createTool({
      id: "skill-upsert-reference",
      description:
        "Create or update a named reference document for a skill. Use this to keep the base skill concise while moving heavy templates, examples, and subtopic guidance into on-demand references.",
      inputSchema: z.object({
        skillName: z.string().describe("The owning skill name"),
        referenceName: z.string().describe("Stable reference id, e.g. meeting-note-template"),
        title: z.string().describe("Human-readable reference title"),
        description: z.string().describe("Short summary shown in the reference manifest"),
        content: z.string().describe("Reference content to load on demand"),
        loadWhen: z.string().optional().describe("When this reference should be loaded"),
        priority: z.number().int().min(0).max(100).optional().describe("Higher priority references appear first"),
        contentFormat: z.enum(["markdown", "text", "json"]).optional().describe("Reference content format"),
      }),
      execute: async ({
        skillName,
        referenceName,
        title,
        description,
        content,
        loadWhen,
        priority,
        contentFormat,
      }) => {
        const skill = await afsSkillService.loadSkillByName(
          this.userId,
          skillName,
          this.agentId,
          this.scope
        )

        if (!skill) {
          return {
            success: false,
            message: `Skill "${skillName}" not found in the current scope. Create or activate it before writing references.`,
          }
        }

        const row = await afsSkillReferenceService.upsertReference(this.userId, skill.id, {
          name: referenceName,
          title,
          description,
          content,
          loadWhen: loadWhen ?? null,
          priority,
          contentFormat,
        })

        this.referenceMetas.delete(skill.id)

        return {
          success: true,
          message: `Reference "${referenceName}" saved for skill "${skillName}".`,
          referenceId: row.id,
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
      this.referenceMetas.clear()
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

      const hasPreferenceMaintainer = this.skillMetas.some(
        (skill) => skill.name === PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME
      )
      const hasPreferredWorkstyle = this.skillMetas.some(
        (skill) => skill.name === PREFERRED_WORKSTYLE_SKILL_NAME
      )

      if (hasPreferenceMaintainer || hasPreferredWorkstyle) {
        const guidance: string[] = []

        if (hasPreferenceMaintainer) {
          guidance.push(
            `If \`${PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME}\` is available and the task touches preferred style, structure, naming, layout, or workflow, activate it before deciding whether to record new preference evidence.`
          )
        }

        if (hasPreferredWorkstyle) {
          guidance.push(
            `If \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` is available for the current scope, activate it before producing the final deliverable unless the user explicitly overrides the default for this one task.`
          )
        }

        guidance.push(
          `Do not overwrite \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` after one weak signal; write a candidate or best-example first when the evidence is still tentative.`
        )

        messageList.addSystem({
          role: "system",
          content: guidance.join(" "),
        })
      }
    }

    // Inject activated-skills content
    if (this.activatedSkillIds.size > 0) {
      const activated = await this.formatActivatedSkills()
      if (activated) {
        messageList.addSystem({ role: "system", content: activated })
      }
    }

    if (this.loadedReferenceIds.size > 0) {
      const references = await this.formatLoadedReferences()
      if (references) {
        messageList.addSystem({ role: "system", content: references })
      }
    }

    // Provide skill tools
    const skillTools: Record<string, unknown> = {}
    if (hasSkills) {
      const activateTool = this.createSkillActivateTool()
      const loadReferenceTool = this.createSkillLoadReferenceTool()
      const upsertReferenceTool = this.createSkillUpsertReferenceTool()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(activateTool as any).needsApprovalFn = () => false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(loadReferenceTool as any).needsApprovalFn = () => false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(upsertReferenceTool as any).needsApprovalFn = () => false
      skillTools["skill-activate"] = activateTool
      skillTools["skill-load-reference"] = loadReferenceTool
      skillTools["skill-upsert-reference"] = upsertReferenceTool
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
