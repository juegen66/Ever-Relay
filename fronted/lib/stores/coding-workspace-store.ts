"use client"

import { create } from "zustand"

import type { CodingRun } from "@/shared/contracts/coding-runs"

export type CodingWorkspacePhase =
  | "reviewing_request"
  | "needs_clarification"
  | "ready_for_confirmation"
  | "workflow_running"
  | "workflow_completed"
  | "workflow_failed"

export interface CodingWorkspaceEntry {
  appId: string
  phase: CodingWorkspacePhase
  summary: string | null
  lastPrompt: string | null
  runId: string | null
  runStage: CodingRun["stage"] | null
  runStatus: CodingRun["status"] | null
  updatedAt: number
}

interface PendingCodingPrompt {
  id: string
  appId: string
  threadId: string
  message: string
  status: "queued" | "sending"
}

interface CodingWorkspaceStore {
  entries: Record<string, CodingWorkspaceEntry>
  pendingPrompt: PendingCodingPrompt | null
  bootstrapProject: (input: {
    appId: string
    prompt: string
  }) => void
  setProjectPhase: (input: {
    appId: string
    phase: Exclude<
      CodingWorkspacePhase,
      "workflow_running" | "workflow_completed" | "workflow_failed"
    >
    summary?: string | null
  }) => void
  markWorkflowRunning: (input: {
    appId: string
    runId: string
  }) => void
  syncRunState: (input: {
    appId: string
    runId: string
    stage: CodingRun["stage"]
    status: CodingRun["status"]
  }) => void
  queuePrompt: (input: Omit<PendingCodingPrompt, "id" | "status">) => void
  markPromptSending: (id: string) => boolean
  resetPrompt: (id: string) => void
  consumePrompt: (id: string) => void
}

function now() {
  return Date.now()
}

function createEntry(appId: string): CodingWorkspaceEntry {
  return {
    appId,
    phase: "reviewing_request",
    summary: null,
    lastPrompt: null,
    runId: null,
    runStage: null,
    runStatus: null,
    updatedAt: now(),
  }
}

export const useCodingWorkspaceStore = create<CodingWorkspaceStore>((set) => ({
  entries: {},
  pendingPrompt: null,
  bootstrapProject: ({ appId, prompt }) =>
    set((state) => {
      const existing = state.entries[appId] ?? createEntry(appId)
      return {
        entries: {
          ...state.entries,
          [appId]: {
            ...existing,
            phase: "reviewing_request",
            summary: "Reviewing the request and deciding whether follow-up questions are needed.",
            lastPrompt: prompt,
            updatedAt: now(),
          },
        },
      }
    }),
  setProjectPhase: ({ appId, phase, summary }) =>
    set((state) => {
      const existing = state.entries[appId] ?? createEntry(appId)
      return {
        entries: {
          ...state.entries,
          [appId]: {
            ...existing,
            phase,
            summary: summary ?? existing.summary,
            updatedAt: now(),
          },
        },
      }
    }),
  markWorkflowRunning: ({ appId, runId }) =>
    set((state) => {
      const existing = state.entries[appId] ?? createEntry(appId)
      return {
        entries: {
          ...state.entries,
          [appId]: {
            ...existing,
            phase: "workflow_running",
            summary: "Workflow is executing inside the project sandbox.",
            runId,
            runStage: "queued",
            runStatus: "running",
            updatedAt: now(),
          },
        },
      }
    }),
  syncRunState: ({ appId, runId, stage, status }) =>
    set((state) => {
      const existing = state.entries[appId] ?? createEntry(appId)
      const nextPhase =
        status === "failed"
          ? "workflow_failed"
          : status === "completed"
            ? "workflow_completed"
            : "workflow_running"
      const summary =
        status === "failed"
          ? "Workflow failed. Re-open the sidebar to inspect the report and retry."
          : status === "completed"
            ? "Workflow finished. Re-open the sidebar for the result summary."
            : "Workflow is executing inside the project sandbox."

      return {
        entries: {
          ...state.entries,
          [appId]: {
            ...existing,
            phase: nextPhase,
            summary,
            runId,
            runStage: stage,
            runStatus: status,
            updatedAt: now(),
          },
        },
      }
    }),
  queuePrompt: ({ appId, threadId, message }) =>
    set({
      pendingPrompt: {
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        appId,
        threadId,
        message,
        status: "queued",
      },
    }),
  markPromptSending: (id) => {
    let claimed = false

    set((state) => {
      if (!state.pendingPrompt || state.pendingPrompt.id !== id) {
        return {}
      }

      if (state.pendingPrompt.status === "sending") {
        return {}
      }

      claimed = true
      return {
        pendingPrompt: {
          ...state.pendingPrompt,
          status: "sending",
        },
      }
    })

    return claimed
  },
  resetPrompt: (id) =>
    set((state) =>
      state.pendingPrompt?.id === id
        ? {
            pendingPrompt: {
              ...state.pendingPrompt,
              status: "queued",
            },
          }
        : {}
    ),
  consumePrompt: (id) =>
    set((state) =>
      state.pendingPrompt?.id === id
        ? {
            pendingPrompt: null,
          }
        : {}
    ),
}))
