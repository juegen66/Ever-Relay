import { afsMemoryIngestSchedulerWorkflow } from "@/server/mastra/inngest/orchestrators/afs-memory-ingest-scheduler.orchestrator"
import { afsMemoryIngestWorkflow } from "@/server/mastra/inngest/orchestrators/afs-memory-ingest.orchestrator"
import { appBuildWorkflow } from "@/server/mastra/inngest/orchestrators/app-build.orchestrator"
import { codingAgentWorkflow } from "@/server/mastra/inngest/orchestrators/coding-agent.orchestrator"
import { logoDesignWorkflow } from "@/server/mastra/inngest/orchestrators/logo-design.orchestrator"

export const workflows = {
  afsMemoryIngest: afsMemoryIngestWorkflow,
  afsMemoryIngestScheduler: afsMemoryIngestSchedulerWorkflow,
  appBuild: appBuildWorkflow,
  codingAgent: codingAgentWorkflow,
  logoDesign: logoDesignWorkflow,
}
