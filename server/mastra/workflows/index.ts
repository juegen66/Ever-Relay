import { appBuildWorkflow } from "@/server/mastra/inngest/orchestrators/app-build.orchestrator"
import { codingAgentWorkflow } from "@/server/mastra/inngest/orchestrators/coding-agent.orchestrator"
import { logoDesignWorkflow } from "@/server/mastra/inngest/orchestrators/logo-design.orchestrator"

export const workflows = {
  appBuild: appBuildWorkflow,
  codingAgent: codingAgentWorkflow,
  logoDesign: logoDesignWorkflow,
}
