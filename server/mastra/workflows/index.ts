import { appBuildWorkflow } from "@/server/mastra/inngest/orchestrators/app-build.orchestrator"

export const workflows = {
  appBuild: appBuildWorkflow,
}
