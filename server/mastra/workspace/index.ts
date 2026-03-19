import { Workspace } from "@mastra/core/workspace"
import { E2BSandbox } from "@mastra/e2b"

import { codingAppsService } from "@/server/modules/coding-apps/coding-apps.service"
import { sandboxBindingsService } from "@/server/modules/sandbox/sandbox-bindings.service"

const MESSAGE_HTML_BUILDER_SKILL_PATH =
  "/Users/qiaodailong/.codex/skills/message-html-builder"

const PREDICTION_REPORT_BUILDER_SKILL_PATH =
  "/Users/qiaodailong/.codex/skills/prediction-report-builder"

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

export function createDesktopSkillWorkspace() {
  return new Workspace({
    id: "desktop-skill-workspace",
    name: "Desktop Skill Workspace",
    skills: [MESSAGE_HTML_BUILDER_SKILL_PATH],
    bm25: true,
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
