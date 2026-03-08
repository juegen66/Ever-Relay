import { randomUUID } from "node:crypto"
import type { Context } from "hono"

import type {
  CopilotHandoffMessage,
  PrepareHandoffBody,
} from "@/shared/contracts/copilot-handoff"
import {
  HANDOFF_SCHEMA_VERSION,
  type HandoffMetadata,
  type HandoffReport,
} from "@/shared/copilot/handoff"
import { compressContext } from "@/server/mastra/agents/context-compression-agent"
import { fail, ok } from "@/server/lib/http/response"
import { requireUserId } from "@/server/lib/http/auth"
import type { ServerBindings } from "@/server/types"

const COMPRESSION_TIMEOUT_MS = 10_000

function toSafeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => Boolean(item))
}

function mergeStringList(base: string[], patch: unknown): string[] {
  const patchList = toStringList(patch)
  if (patchList.length === 0) {
    return base
  }
  // Merge and deduplicate
  const combined = [...base, ...patchList]
  return [...new Set(combined)]
}

function truncateText(input: string, maxChars: number) {
  if (input.length <= maxChars) {
    return input
  }

  return `${input.slice(0, Math.max(0, maxChars - 3))}...`
}

function inferTask(messages: CopilotHandoffMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== "user") continue
    if (!message.content) continue
    return truncateText(message.content, 240)
  }

  return "Continue the current task with focused context."
}

const TOOL_RESULT_MAX_CHARS = 300

function formatMessageForDigest(message: CopilotHandoffMessage, index: number) {
  const label = message.role.toUpperCase()
  const content =
    message.role === "tool"
      ? truncateText(message.content, TOOL_RESULT_MAX_CHARS)
      : message.content
  return `${index + 1}. ${label}: ${content}`
}

async function buildContextDigest(
  messages: CopilotHandoffMessage[],
  maxChars: number
): Promise<string> {
  const relevant = messages
    .filter((message) => {
      const role = message.role
      return role === "user" || role === "assistant" || role === "tool"
    })
    .filter((message) => !message.content.includes("[HANDOFF_METADATA_V1]"))
    .slice(-20)

  if (relevant.length === 0) {
    return "No prior chat context was available."
  }

  const lines = relevant.map((message, index) =>
    formatMessageForDigest(message, index)
  )

  const rawText = lines.join("\n")
  if (rawText.length <= maxChars) {
    return rawText
  }

  const withTimeout = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Compression timeout"))
    }, COMPRESSION_TIMEOUT_MS)
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
    if (summary) {
      return truncateText(summary, maxChars)
    }
  } catch {
    // Fallback to truncation on error or timeout
  }

  return truncateText(rawText, maxChars)
}

async function buildReport(body: PrepareHandoffBody): Promise<HandoffReport> {
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
  if (!reportPatch) {
    return baseReport
  }

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

async function buildHandoffMetadata(
  body: PrepareHandoffBody
): Promise<HandoffMetadata | null> {
  const sourceAgentId = toSafeText(body.sourceAgentId)
  const threadId = toSafeText(body.threadId)

  if (!sourceAgentId || !threadId) {
    return null
  }

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

export async function prepareHandoff(
  context: Context<ServerBindings>,
  body: PrepareHandoffBody
) {
  requireUserId(context)

  const metadata = await buildHandoffMetadata(body)
  if (!metadata) {
    return fail(
      context,
      400,
      "sourceAgentId and threadId are required for handoff preparation"
    )
  }

  const truncateBeforeMessageId = toSafeText(body.lastMessageId) || null

  return ok(context, {
    metadata,
    droppedMessageCount: body.messages.length,
    truncateBeforeMessageId,
  })
}
