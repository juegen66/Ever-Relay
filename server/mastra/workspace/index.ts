import { Workspace } from "@mastra/core/workspace"
import { E2BSandbox } from "@mastra/e2b"

import { DbSkillSource } from "@/server/afs/skill-source"
import { codingAppsService } from "@/server/modules/coding-apps/coding-apps.service"
import { sandboxBindingsService } from "@/server/modules/sandbox/sandbox-bindings.service"

const PREDICTION_REPORT_BUILDER_SKILL_PATH =
  "/Users/qiaodailong/.codex/skills/prediction-report-builder"

// Virtual root path used by DbSkillSource for dynamic DB-backed skills
const DB_SKILLS_ROOT = "/db-skills"

export interface WorkspaceScope {
  userId: string
  projectId?: string | null
  runId?: string
}

export interface WorkspaceKindConfig {
  idPrefix: string
  name: string
}

function toScopeLabel(scope: WorkspaceScope) {
  const projectPart = scope.projectId ? `project:${scope.projectId}` : "project:none"
  const runPart = scope.runId ? `run:${scope.runId}` : "run:none"
  return `user:${scope.userId} ${projectPart} ${runPart}`
}

async function createScopedWorkspace(scope: WorkspaceScope, config: WorkspaceKindConfig) {
  if (!scope.userId) {
    throw new Error("Cannot create workspace without userId")
  }

  const binding = await sandboxBindingsService.getOrCreateByUserId(scope.userId)
  const label = toScopeLabel(scope)

  return new Workspace({
    id: `${config.idPrefix}-${scope.userId}-${scope.runId ?? "adhoc"}`,
    name: `${config.name} (${scope.userId})`,
    sandbox: new E2BSandbox({
      id: binding.sandboxId,
      timeout: 300_000,
      env: {
        CLOUDOS_USER_ID: scope.userId,
        CLOUDOS_PROJECT_ID: scope.projectId ?? "",
        CLOUDOS_RUN_ID: scope.runId ?? "",
        CLOUDOS_SANDBOX_ID: binding.sandboxId,
      },
      instructions: ({ defaultInstructions }) => {
        return `${defaultInstructions}\n\nWorkspace scope: ${label}`
      },
    }),
  })
}

export type BuildWorkspaceScope = WorkspaceScope
export interface CodingWorkspaceScope {
  userId: string
  appId: string
  runId?: string
}

export async function createBuildWorkspace(scope: BuildWorkspaceScope) {
  return createScopedWorkspace(scope, {
    idPrefix: "build-workspace",
    name: "Build Workspace",
  })
}

export function createPredictionSkillWorkspace() {
  return new Workspace({
    id: "prediction-skill-workspace",
    name: "Prediction Skill Workspace",
    skills: [PREDICTION_REPORT_BUILDER_SKILL_PATH],
    bm25: true,
  })
}

/**
 * Create a workspace with dynamic skills loaded from the afs_skill table.
 *
 * Skills are resolved at runtime via DbSkillSource which implements Mastra's
 * SkillSource interface. The Workspace SkillsProcessor handles the two-phase
 * loading: metadata first (system message), full content on skill-activate.
 *
 * @param userId - Owner of the skills
 * @param agentId - Optional agent ID to scope skills
 * @param extraLocalSkills - Optional array of local filesystem skill paths to include alongside DB skills
 */
export function createDynamicSkillWorkspace(
  userId: string,
  agentId?: string,
  extraLocalSkills?: string[]
) {
  const dbSource = new DbSkillSource({ userId, agentId })
  const skillPaths = [DB_SKILLS_ROOT, ...(extraLocalSkills ?? [])]

  return new Workspace({
    id: `dynamic-skill-workspace-${userId}-${agentId ?? "global"}`,
    name: `Dynamic Skill Workspace (${agentId ?? "global"})`,
    skills: skillPaths,
    skillSource: dbSource,
    bm25: true,
  })
}

export async function createCodingWorkspace(scope: CodingWorkspaceScope) {
  const app = await codingAppsService.getAppByIdForUser(scope.appId, scope.userId)
  if (!app) {
    throw new Error(`Coding app not found for workspace: ${scope.appId}`)
  }

  const label = `user:${scope.userId} app:${scope.appId} run:${scope.runId ?? "none"}`

  return new Workspace({
    id: `coding-workspace-${scope.userId}-${scope.appId}-${scope.runId ?? "adhoc"}`,
    name: `Coding Workspace (${app.name})`,
    sandbox: new E2BSandbox({
      id: app.sandboxId,
      timeout: 300_000,
      env: {
        CLOUDOS_USER_ID: scope.userId,
        CLOUDOS_CODING_APP_ID: scope.appId,
        CLOUDOS_RUN_ID: scope.runId ?? "",
        CLOUDOS_SANDBOX_ID: app.sandboxId,
      },
      instructions: ({ defaultInstructions }) => {
        return `${defaultInstructions}\n\nWorkspace scope: ${label}`
      },
    }),
  })
}
