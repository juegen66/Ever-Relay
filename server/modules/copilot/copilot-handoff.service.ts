import { randomUUID } from "node:crypto"

import type {
  CopilotHandoffMessage,
  PrepareHandoffBody,
} from "@/shared/contracts/copilot-handoff"
import {
  HANDOFF_SCHEMA_VERSION,
  type HandoffMetadata,
  type HandoffReport,
} from "@/shared/copilot/handoff"
import { compressContext } from "@/server/mastra/agents/shared/context-compression-agent"
import {
  formatMessageForDigest,
  inferTask,
  mergeStringList,
  toSafeText,
  toStringList,
  truncateText,
} from "./copilot-handoff.utils"

const COMPRESSION_TIMEOUT_MS = 10_000

async function buildContextDigest(
  messages: CopilotHandoffMessage[],
  maxChars: number
): Promise<string> {
  const relevant = messages
    .filter((m) => {
      const role = m.role
      return role === "user" || role === "assistant" || role === "tool"
    })
    .filter((m) => !m.content.includes("[HANDOFF_METADATA_V1]"))
    .slice(-20)

  if (relevant.length === 0) {
    return "No prior chat context was available."
  }

  const lines = relevant.map((m, i) => formatMessageForDigest(m, i))
  const rawText = lines.join("\n")

  if (rawText.length <= maxChars) return rawText

  const withTimeout = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Compression timeout")), COMPRESSION_TIMEOUT_MS)
    compressContext(rawText, maxChars)
      .then((summary) => {
        clearTimeout(timer)
        resolve(summary)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })

  try {
    const summary = await withTimeout
    if (summary) return truncateText(summary, maxChars)
  } catch {
    // Fallback to truncation on error or timeout
  }

  return truncateText(rawText, maxChars)
}

export async function buildReport(body: PrepareHandoffBody): Promise<HandoffReport> {
  const maxTokens =
    typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)
      ? body.maxTokens
      : 400
  const maxChars = Math.max(100, maxTokens) * 4
  const digest = await buildContextDigest(body.messages, maxChars)

  return {
    task: toSafeText(body.task) || inferTask(body.messages),
    contextDigest: digest,
    done: toStringList(body.done),
    nextSteps: toStringList(body.nextSteps),
    constraints: toStringList(body.constraints),
    artifacts: toStringList(body.artifacts),
    openQuestions: toStringList(body.openQuestions),
    riskNotes: toStringList(body.riskNotes),
  }
}

function mergeReport(
  baseReport: HandoffReport,
  reportPatch?: Partial<HandoffReport>
): HandoffReport {
  if (!reportPatch) return baseReport

  return {
    task: toSafeText(reportPatch.task) || baseReport.task,
    contextDigest: toSafeText(reportPatch.contextDigest) || baseReport.contextDigest,
    done: mergeStringList(baseReport.done, reportPatch.done),
    nextSteps: mergeStringList(baseReport.nextSteps, reportPatch.nextSteps),
    constraints: mergeStringList(baseReport.constraints, reportPatch.constraints),
    artifacts: mergeStringList(baseReport.artifacts, reportPatch.artifacts),
    openQuestions: mergeStringList(baseReport.openQuestions, reportPatch.openQuestions),
    riskNotes: mergeStringList(baseReport.riskNotes, reportPatch.riskNotes),
  }
}

/**
 * Markdown document stored for audit/history and replayed by the frontend
 * back into the target agent after mode switch.
 */
export function formatHandoffDocument(report: HandoffReport): string {
  const lines: string[] = [
    `# Agent handoff`,
    ``,
    `## Task`,
    report.task,
    ``,
    `## Prior context (compressed)`,
    report.contextDigest,
  ]

  const appendList = (title: string, items: string[]) => {
    if (items.length === 0) return
    lines.push(``, `## ${title}`, ...items.map((item) => `- ${item}`))
  }

  appendList("Done", report.done)
  appendList("Next steps", report.nextSteps)
  appendList("Constraints", report.constraints)
  appendList("Artifacts", report.artifacts)
  appendList("Open questions", report.openQuestions)
  appendList("Risk notes", report.riskNotes)

  return lines.join("\n")
}

export async function buildHandoffMetadata(
  body: PrepareHandoffBody
): Promise<HandoffMetadata | null> {
  const sourceAgentId = toSafeText(body.sourceAgentId)
  const threadId = toSafeText(body.threadId)

  if (!sourceAgentId || !threadId) return null

  const baseReport = await buildReport(body)
  const report = mergeReport(baseReport, body.report)

  return {
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    handoffId: randomUUID(),
    sourceAgentId,
    targetAgentId: body.targetAgentId,
    threadId,
    createdAt: new Date().toISOString(),
    reason: toSafeText(body.reason) || null,
    report,
  }
}
