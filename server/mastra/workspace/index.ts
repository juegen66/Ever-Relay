import { Workspace } from "@mastra/core/workspace"
import { E2BSandbox } from "@mastra/e2b"
import { sandboxBindingsService } from "@/server/modules/sandbox/sandbox-bindings.service"

export interface BuildWorkspaceScope {
  userId: string
  projectId?: string | null
  runId?: string
}

function toScopeLabel(scope: BuildWorkspaceScope) {
  const projectPart = scope.projectId ? `project:${scope.projectId}` : "project:none"
  const runPart = scope.runId ? `run:${scope.runId}` : "run:none"
  return `user:${scope.userId} ${projectPart} ${runPart}`
}

export async function createBuildWorkspace(scope: BuildWorkspaceScope) {
  if (!scope.userId) {
    throw new Error("Cannot create workspace without userId")
  }

  const binding = await sandboxBindingsService.getOrCreateByUserId(scope.userId)
  const label = toScopeLabel(scope)

  return new Workspace({
    id: `build-workspace-${scope.userId}-${scope.runId ?? "adhoc"}`,
    name: `Build Workspace (${scope.userId})`,
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
