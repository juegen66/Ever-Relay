import { appBuildWorkflow } from "@/server/mastra/inngest/orchestrators/app-build.orchestrator"
import { logoDesignWorkflow } from "@/server/mastra/inngest/orchestrators/logo-design.orchestrator"

export const workflows = {
  appBuild: appBuildWorkflow,
  logoDesign: logoDesignWorkflow,
}
