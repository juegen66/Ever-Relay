import {
  SKILL_TEST_AGENT_ID,
  SKILL_TEST_DEFAULT_USER_ID,
  PARALLEL_PLANNER_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"

export interface ParallelWorkflowSourceConfig {
  sourceAgentId: string
  plannerAgentId: string
  defaultTaskAgentId: string
  allowedTaskAgentIds: readonly string[]
  workerActiveTools: readonly string[]
  defaultUserId?: string
  minimumComplexityScore: number
  complexityKeywords: readonly string[]
}

const SKILL_TEST_COMPLEXITY_KEYWORDS = [
  "verify",
  "validation",
  "diagnose",
  "diagnostic",
  "activate",
  "loading",
  "available skills",
  "cross-scope",
  "matrix",
  "report",
  "多步",
  "复杂",
  "验证",
  "诊断",
  "技能",
  "并发",
]

export const parallelWorkflowRegistry: Record<string, ParallelWorkflowSourceConfig> = {
  [SKILL_TEST_AGENT_ID]: {
    sourceAgentId: SKILL_TEST_AGENT_ID,
    plannerAgentId: PARALLEL_PLANNER_AGENT_ID,
    defaultTaskAgentId: SKILL_TEST_AGENT_ID,
    allowedTaskAgentIds: [SKILL_TEST_AGENT_ID],
    workerActiveTools: ["skill-activate"],
    defaultUserId: SKILL_TEST_DEFAULT_USER_ID,
    minimumComplexityScore: 2,
    complexityKeywords: SKILL_TEST_COMPLEXITY_KEYWORDS,
  },
}

export function getParallelWorkflowSourceConfig(sourceAgentId: string) {
  return parallelWorkflowRegistry[sourceAgentId] ?? null
}
