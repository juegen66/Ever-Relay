import {
  uniqStrings,
} from "@/server/mastra/workflows/parallel-workflow/helpers"
import type {
  ParallelWorkflowSourceConfig,
} from "@/server/mastra/workflows/parallel-workflow/registry"
import {
  agentRegistryService,
} from "@/server/modules/agent-activity/agent-registry.service"

interface AgentLike {
  id?: string
}

interface MastraLike {
  listAgents?: () => Record<string, AgentLike>
}

interface ResolveParallelTaskAgentIdsParams {
  config: ParallelWorkflowSourceConfig
  registeredAgentIds: readonly string[]
  runtimeAgentIds: readonly string[]
}

export function collectRuntimeAgentIds(mastra?: MastraLike) {
  const runtimeAgents = mastra?.listAgents?.() ?? {}
  const runtimeAgentIds: string[] = []

  for (const [key, agent] of Object.entries(runtimeAgents)) {
    if (key.trim()) {
      runtimeAgentIds.push(key.trim())
    }

    if (typeof agent?.id === "string" && agent.id.trim()) {
      runtimeAgentIds.push(agent.id.trim())
    }
  }

  return uniqStrings(runtimeAgentIds)
}

export function resolveParallelTaskAgentIds({
  config,
  registeredAgentIds,
  runtimeAgentIds,
}: ResolveParallelTaskAgentIdsParams) {
  const runtimeAgentIdSet = new Set(runtimeAgentIds)
  const runtimeFilterEnabled = runtimeAgentIdSet.size > 0

  const preferredAgentIds = registeredAgentIds
    .map((agentId) => agentId.trim())
    .filter(Boolean)
    .filter((agentId) => agentId !== config.plannerAgentId)

  const fallbackAgentIds = [
    ...config.allowedTaskAgentIds,
    config.defaultTaskAgentId,
  ].filter((agentId) => agentId !== config.plannerAgentId)

  const preferredOrFallback = preferredAgentIds.length > 0
    ? preferredAgentIds
    : fallbackAgentIds

  const filteredPreferredOrFallback = runtimeFilterEnabled
    ? preferredOrFallback.filter((agentId) => runtimeAgentIdSet.has(agentId))
    : preferredOrFallback

  const filteredFallback = runtimeFilterEnabled
    ? fallbackAgentIds.filter((agentId) => runtimeAgentIdSet.has(agentId))
    : fallbackAgentIds

  const resolvedAgentIds = uniqStrings([
    ...filteredPreferredOrFallback,
    ...filteredFallback,
  ])

  return resolvedAgentIds.length > 0
    ? resolvedAgentIds
    : [config.defaultTaskAgentId]
}

export async function loadParallelTaskAgentIds(
  config: ParallelWorkflowSourceConfig,
  mastra?: MastraLike
) {
  let registeredAgentIds: string[] = []

  try {
    registeredAgentIds = await agentRegistryService.listParallelWorkflowRuntimeAgentIds()
  } catch {
    registeredAgentIds = []
  }

  return resolveParallelTaskAgentIds({
    config,
    registeredAgentIds,
    runtimeAgentIds: collectRuntimeAgentIds(mastra),
  })
}
