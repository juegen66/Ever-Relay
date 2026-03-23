/**
 * DbSkillSource — Implements Mastra's SkillSource interface backed by afs_skill table.
 *
 * This bridges our DB skill storage with Mastra's Workspace skill discovery system.
 * The Workspace expects skills to live in a filesystem-like structure:
 *   <skillPath>/<skillName>/SKILL.md
 *
 * We simulate this by mapping DB rows to virtual paths. When Mastra calls
 * readFile on a SKILL.md path, we return the content from the DB row.
 */

import type {
  SkillSource,
  SkillSourceEntry,
  SkillSourceStat,
} from "@mastra/core/workspace"

import { afsSkillService } from "./skill"
import type { AfsScope } from "@/server/db/schema"

export interface DbSkillSourceConfig {
  userId: string
  agentId?: string
  scope?: AfsScope
}

export class DbSkillSource implements SkillSource {
  private readonly userId: string
  private readonly agentId?: string
  private readonly scope?: AfsScope
  /** Cache of skill rows keyed by name, refreshed on readdir of root */
  private cache = new Map<string, { id: string; description: string; content: string; updatedAt: Date }>()

  constructor(config: DbSkillSourceConfig) {
    this.userId = config.userId
    this.agentId = config.agentId
    this.scope = config.scope
  }

  /**
   * Refresh internal cache from DB.
   */
  private async refreshCache(): Promise<void> {
    const metas = await afsSkillService.listSkillMeta(this.userId, {
      agentId: this.agentId,
      scope: this.scope,
    })

    this.cache.clear()
    for (const meta of metas) {
      // We store just enough to serve exists/stat/readdir without hitting DB again.
      // loadSkillContent is only called for readFile on SKILL.md.
      if (this.cache.has(meta.name)) continue

      this.cache.set(meta.name, {
        id: meta.id,
        description: meta.description,
        content: "", // lazy — only loaded in readFile
        updatedAt: new Date(meta.updatedAt),
      })
    }
  }

  /**
   * Extract skill name from a path like "/skills/my-skill" or "/skills/my-skill/SKILL.md"
   */
  private parseSkillName(path: string): string | null {
    const segments = path.replace(/^\/+|\/+$/g, "").split("/")
    // Expected: <rootDir>/<skillName> or <rootDir>/<skillName>/SKILL.md
    if (segments.length >= 2) {
      return segments[1]
    }
    return null
  }

  async exists(path: string): Promise<boolean> {
    const normalized = path.replace(/^\/+|\/+$/g, "")
    const segments = normalized.split("/")

    // Root skills dir always exists
    if (segments.length === 1) return true

    const skillName = segments[1]
    if (this.cache.size === 0) await this.refreshCache()

    if (!this.cache.has(skillName)) return false

    // Skill dir exists
    if (segments.length === 2) return true

    // SKILL.md exists
    if (segments.length === 3 && segments[2] === "SKILL.md") return true

    return false
  }

  async stat(path: string): Promise<SkillSourceStat> {
    const normalized = path.replace(/^\/+|\/+$/g, "")
    const segments = normalized.split("/")

    const now = new Date()

    // Root dir
    if (segments.length <= 1) {
      return { name: segments[0] || "skills", type: "directory", size: 0, createdAt: now, modifiedAt: now }
    }

    const skillName = segments[1]
    if (this.cache.size === 0) await this.refreshCache()
    const cached = this.cache.get(skillName)
    const modifiedAt = cached?.updatedAt ?? now

    // Skill directory
    if (segments.length === 2) {
      return { name: skillName, type: "directory", size: 0, createdAt: modifiedAt, modifiedAt }
    }

    // SKILL.md file
    if (segments.length === 3 && segments[2] === "SKILL.md") {
      return { name: "SKILL.md", type: "file", size: 0, createdAt: modifiedAt, modifiedAt }
    }

    throw new Error(`DbSkillSource: path not found: ${path}`)
  }

  async readFile(path: string): Promise<string> {
    const normalized = path.replace(/^\/+|\/+$/g, "")
    const segments = normalized.split("/")
    if (this.cache.size === 0) await this.refreshCache()

    const skillName = segments[1]

    if (segments.length >= 3 && segments[2] === "SKILL.md") {
      // Load full skill from DB
      const row = await afsSkillService.loadSkillByName(
        this.userId,
        skillName,
        this.agentId,
        this.scope
      )

      if (!row) {
        throw new Error(`DbSkillSource: skill not found: ${skillName}`)
      }

      // Build SKILL.md content with YAML frontmatter + markdown body
      const triggerLine = row.triggerWhen ? `\ntrigger_when: "${row.triggerWhen}"` : ""
      const tagsLine = row.tags.length > 0 ? `\ntags: ${JSON.stringify(row.tags)}` : ""

      return [
        "---",
        `name: ${row.name}`,
        `description: "${row.description}"`,
        `version: ${row.version}`,
        `priority: ${row.priority}`,
        triggerLine,
        tagsLine,
        "---",
        "",
        row.content,
      ]
        .filter((line) => line !== "")
        .join("\n")
    }

    throw new Error(`DbSkillSource: can only read SKILL.md files, got: ${path}`)
  }

  async readdir(path: string): Promise<SkillSourceEntry[]> {
    const normalized = path.replace(/^\/+|\/+$/g, "")
    const segments = normalized.split("/")

    // Root: list all skill directories
    if (segments.length <= 1) {
      await this.refreshCache()
      return Array.from(this.cache.keys()).map((name) => ({
        name,
        type: "directory" as const,
      }))
    }

    // Skill dir: return SKILL.md
    if (segments.length === 2) {
      const skillName = segments[1]
      if (this.cache.size === 0) await this.refreshCache()
      if (!this.cache.has(skillName)) return []

      return [{ name: "SKILL.md", type: "file" as const }]
    }

    return []
  }
}
