export const HANDOFF_SCHEMA_VERSION = "1"

export interface HandoffReport {
  task: string
  contextDigest: string
  done: string[]
  nextSteps: string[]
  constraints: string[]
  artifacts: string[]
  openQuestions: string[]
  riskNotes: string[]
}

export interface HandoffMetadata {
  schemaVersion: typeof HANDOFF_SCHEMA_VERSION
  handoffId: string
  sourceAgentId: string
  targetAgentId: string
  threadId: string
  createdAt: string
  reason: string | null
  report: HandoffReport
}
