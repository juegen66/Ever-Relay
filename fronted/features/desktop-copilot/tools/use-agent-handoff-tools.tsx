"use client"

import { useCallback, useMemo, useRef } from "react"

import { useCopilotChatInternal, useFrontendTool } from "@copilotkit/react-core"

import {
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"
import {
  HANDOFF_SCHEMA_VERSION,
  type HandoffMetadata,
  type HandoffReport,
} from "@/shared/copilot/handoff"
import { useDesktopUIStore, type CopilotAgentMode } from "@/lib/stores/desktop-ui-store"
import {
  HANDOFF_TO_AGENT_PARAMS,
  SUMMARIZE_CONTEXT_FOR_HANDOFF_PARAMS,
} from "./types"

const AGENT_ID_TO_MODE: Record<string, CopilotAgentMode> = {
  [DESKTOP_COPILOT_AGENT]: "main",
  [LOGO_COPILOT_AGENT]: "logo",
}

type ChatMessage = {
  role?: string
  content?: unknown
}

type HandoffSummaryArgs = {
  targetAgentId?: string
  maxTokens?: number
  task?: string
  done?: string[]
  nextSteps?: string[]
  constraints?: string[]
  artifacts?: string[]
  openQuestions?: string[]
  riskNotes?: string[]
}

type HandoffToolArgs = {
  targetAgentId?: string
  reason?: string
  report?: Record<string, unknown>
}

type CachedReport = {
  targetAgentId: string
  report: HandoffReport
}

function toSafeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => Boolean(item))
}

function toMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim()
  }

  if (!Array.isArray(content)) {
    return ""
  }

  const textParts = content
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const record = item as Record<string, unknown>
      if (record.type !== "text") return ""
      return typeof record.text === "string" ? record.text : ""
    })
    .filter((item) => Boolean(item))

  return textParts.join("\n").trim()
}

function truncateText(input: string, maxChars: number) {
  if (input.length <= maxChars) {
    return input
  }

  return `${input.slice(0, Math.max(0, maxChars - 3))}...`
}

function inferTask(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== "user") continue
    const content = toMessageText(message.content)
    if (!content) continue
    return truncateText(content, 240)
  }

  return "Continue the current task with focused context."
}

function buildContextDigest(messages: ChatMessage[], maxChars: number) {
  const relevant = messages
    .filter((message) => {
      const role = message.role ?? ""
      return role === "user" || role === "assistant"
    })
    .map((message) => {
      const role = message.role === "assistant" ? "ASSISTANT" : "USER"
      const content = toMessageText(message.content)
      return { role, content }
    })
    .filter((message) => Boolean(message.content))
    .filter((message) => !message.content.includes("[HANDOFF_METADATA_V1]"))
    .slice(-14)

  if (relevant.length === 0) {
    return "No prior chat context was available."
  }

  const lines = relevant.map((message, index) => `${index + 1}. ${message.role}: ${message.content}`)
  return truncateText(lines.join("\n"), maxChars)
}

function toHandoffReport(
  source: Partial<HandoffReport>,
  fallbackTask: string,
  fallbackDigest: string
): HandoffReport {
  const task = toSafeText(source.task) || fallbackTask
  const contextDigest = toSafeText(source.contextDigest) || fallbackDigest

  return {
    task,
    contextDigest,
    done: toStringList(source.done),
    nextSteps: toStringList(source.nextSteps),
    constraints: toStringList(source.constraints),
    artifacts: toStringList(source.artifacts),
    openQuestions: toStringList(source.openQuestions),
    riskNotes: toStringList(source.riskNotes),
  }
}

function formatHandoffMetadata(metadata: HandoffMetadata) {
  return [
    "[HANDOFF_METADATA_V1]",
    JSON.stringify(metadata, null, 2),
    "[/HANDOFF_METADATA_V1]",
    "Use this metadata as the primary context for continuation.",
  ].join("\n")
}

function nextAnimationFrame() {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

export function useAgentHandoffTools() {
  const { messages, sendMessage } = useCopilotChatInternal({})
  const copilotAgentMode = useDesktopUIStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopUIStore((state) => state.copilotThreadId)
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)
  const lastReportRef = useRef<CachedReport | null>(null)

  const sourceAgentId = useMemo(
    () => (copilotAgentMode === "logo" ? LOGO_COPILOT_AGENT : DESKTOP_COPILOT_AGENT),
    [copilotAgentMode]
  )

  const summarizeContextForHandoff = useCallback(
    async (args: HandoffSummaryArgs) => {
      const targetAgentId = toSafeText(args.targetAgentId)
      if (!targetAgentId || !AGENT_ID_TO_MODE[targetAgentId]) {
        return {
          ok: false,
          error: `Unsupported targetAgentId: ${args.targetAgentId ?? "unknown"}`,
        }
      }

      const maxTokens = Number.isFinite(args.maxTokens) ? Math.max(100, Math.floor(args.maxTokens as number)) : 400
      const maxChars = maxTokens * 4
      const digest = buildContextDigest(messages as ChatMessage[], maxChars)
      const report = toHandoffReport(
        {
          task: args.task,
          contextDigest: digest,
          done: args.done,
          nextSteps: args.nextSteps,
          constraints: args.constraints,
          artifacts: args.artifacts,
          openQuestions: args.openQuestions,
          riskNotes: args.riskNotes,
        },
        inferTask(messages as ChatMessage[]),
        digest
      )

      lastReportRef.current = { targetAgentId, report }

      return {
        ok: true,
        sourceAgentId,
        targetAgentId,
        threadId: copilotThreadId,
        report,
      }
    },
    [copilotThreadId, messages, sourceAgentId]
  )

  const handoffToAgent = useCallback(
    async (args: HandoffToolArgs) => {
      const targetAgentId = toSafeText(args.targetAgentId)
      const targetMode = AGENT_ID_TO_MODE[targetAgentId]
      if (!targetMode) {
        return {
          ok: false,
          error: `Unsupported targetAgentId: ${args.targetAgentId ?? "unknown"}`,
        }
      }

      if (targetAgentId === sourceAgentId) {
        return {
          ok: true,
          skipped: true,
          reason: "Already using target agent",
          sourceAgentId,
          targetAgentId,
          threadId: copilotThreadId,
        }
      }

      const maxChars = 1600
      const digest = buildContextDigest(messages as ChatMessage[], maxChars)
      const reportFromArgs = args.report as Partial<HandoffReport> | undefined
      const fallbackReport = lastReportRef.current?.targetAgentId === targetAgentId ? lastReportRef.current.report : null
      const report = toHandoffReport(
        reportFromArgs ?? fallbackReport ?? { contextDigest: digest },
        inferTask(messages as ChatMessage[]),
        digest
      )
      lastReportRef.current = { targetAgentId, report }

      const handoffMetadata: HandoffMetadata = {
        schemaVersion: HANDOFF_SCHEMA_VERSION,
        handoffId: crypto.randomUUID(),
        sourceAgentId,
        targetAgentId,
        threadId: copilotThreadId,
        createdAt: new Date().toISOString(),
        reason: toSafeText(args.reason) || null,
        report,
      }

      setCopilotAgentMode(targetMode)
      await nextAnimationFrame()

      await sendMessage(
        {
          id: crypto.randomUUID(),
          role: "developer",
          content: formatHandoffMetadata(handoffMetadata),
        },
        { followUp: true }
      )

      return {
        ok: true,
        handoffId: handoffMetadata.handoffId,
        sourceAgentId,
        targetAgentId,
        threadId: copilotThreadId,
        metadata: handoffMetadata,
      }
    },
    [copilotThreadId, messages, sendMessage, setCopilotAgentMode, sourceAgentId]
  )

  useFrontendTool(
    {
      name: "summarize_context_for_handoff",
      description:
        "Summarize current context into a compact handoff report for another agent, keeping the same thread id.",
      parameters: SUMMARIZE_CONTEXT_FOR_HANDOFF_PARAMS,
      handler: async (args) => {
        return summarizeContextForHandoff({
          targetAgentId: typeof args.targetAgentId === "string" ? args.targetAgentId : undefined,
          maxTokens: typeof args.maxTokens === "number" ? args.maxTokens : undefined,
          task: typeof args.task === "string" ? args.task : undefined,
          done: Array.isArray(args.done) ? (args.done as string[]) : undefined,
          nextSteps: Array.isArray(args.nextSteps) ? (args.nextSteps as string[]) : undefined,
          constraints: Array.isArray(args.constraints) ? (args.constraints as string[]) : undefined,
          artifacts: Array.isArray(args.artifacts) ? (args.artifacts as string[]) : undefined,
          openQuestions: Array.isArray(args.openQuestions) ? (args.openQuestions as string[]) : undefined,
          riskNotes: Array.isArray(args.riskNotes) ? (args.riskNotes as string[]) : undefined,
        })
      },
    },
    [summarizeContextForHandoff]
  )

  useFrontendTool(
    {
      name: "handoff_to_agent",
      description:
        "Switch to another agent without changing thread id. Injects compact handoff metadata before continuation.",
      parameters: HANDOFF_TO_AGENT_PARAMS,
      handler: async (args) => {
        return handoffToAgent({
          targetAgentId: typeof args.targetAgentId === "string" ? args.targetAgentId : undefined,
          reason: typeof args.reason === "string" ? args.reason : undefined,
          report: typeof args.report === "object" && args.report !== null ? (args.report as Record<string, unknown>) : undefined,
        })
      },
    },
    [handoffToAgent]
  )
}
