"use client"

import { create } from "zustand"

import type { CodingApp } from "@/shared/contracts/coding-apps"
import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"
import type { HandoffMetadata } from "@/shared/copilot/handoff"

export type CopilotAgentMode = "main" | "logo" | "coding"
export type SilentPredictionStatus = "idle" | "running" | "stopping"
export type ActiveCodingApp = Pick<
  CodingApp,
  "id" | "name" | "description" | "threadId" | "sandboxId" | "status" | "lastOpenedAt"
>

export interface PendingHandoff {
  id: string
  threadId: string
  targetMode: CopilotAgentMode
  metadata: HandoffMetadata
  status: "queued" | "sending"
}

export function createCopilotThreadId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === "x" ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const initialMainCopilotThreadId = createCopilotThreadId()

interface DesktopAgentStore {
  copilotSidebarOpen: boolean
  copilotAgentMode: CopilotAgentMode
  mainCopilotThreadId: string
  copilotThreadId: string
  activeCodingApp: ActiveCodingApp | null
  silentAgentId: string | null
  silentThreadId: string
  silentStatus: SilentPredictionStatus
  silentRunning: boolean
  silentLastStartedAt: number | null
  silentRunRequestId: number
  pendingHandoff: PendingHandoff | null
  setCopilotSidebarOpen: (open: boolean) => void
  setCopilotAgentMode: (mode: CopilotAgentMode) => void
  startNewCopilotThread: () => void
  setActiveCodingApp: (app: ActiveCodingApp) => void
  syncActiveCodingApp: (app: ActiveCodingApp) => void
  clearActiveCodingApp: (options?: { freshMainThread?: boolean }) => void
  queueSilentPredictionRun: () => { requestId: number; threadId: string }
  markSilentPredictionStopping: (requestId?: number) => boolean
  finishSilentPredictionRun: (requestId?: number) => boolean
  resetSilentPredictionSession: (requestId?: number) => void
  queuePendingHandoff: (handoff: Omit<PendingHandoff, "status">) => void
  markPendingHandoffSending: (id: string) => boolean
  clearPendingHandoff: (id: string) => void
  resetPendingHandoff: (id: string) => void
}

export const useDesktopAgentStore = create<DesktopAgentStore>((set) => ({
  copilotSidebarOpen: false,
  copilotAgentMode: "main",
  mainCopilotThreadId: initialMainCopilotThreadId,
  copilotThreadId: initialMainCopilotThreadId,
  activeCodingApp: null,
  silentAgentId: null,
  silentThreadId: createCopilotThreadId(),
  silentStatus: "idle",
  silentRunning: false,
  silentLastStartedAt: null,
  silentRunRequestId: 0,
  pendingHandoff: null,
  setCopilotSidebarOpen: (open) => set({ copilotSidebarOpen: open }),
  setCopilotAgentMode: (mode) => set({ copilotAgentMode: mode }),
  startNewCopilotThread: () =>
    set((state) => {
      const nextMainThreadId = createCopilotThreadId()

      if (state.activeCodingApp) {
        return {
          mainCopilotThreadId: nextMainThreadId,
        }
      }

      return {
        mainCopilotThreadId: nextMainThreadId,
        copilotThreadId: nextMainThreadId,
      }
    }),
  setActiveCodingApp: (app) =>
    set({
      activeCodingApp: app,
      copilotAgentMode: "coding",
      copilotThreadId: app.threadId,
    }),
  syncActiveCodingApp: (app) =>
    set((state) =>
      state.activeCodingApp?.id === app.id
        ? {
            activeCodingApp: app,
            copilotThreadId: app.threadId,
          }
        : {}
    ),
  clearActiveCodingApp: (options) =>
    set((state) => {
      const nextMainThreadId = options?.freshMainThread
        ? createCopilotThreadId()
        : state.mainCopilotThreadId

      return {
        mainCopilotThreadId: nextMainThreadId,
        activeCodingApp: null,
        copilotThreadId: nextMainThreadId,
        copilotAgentMode: state.copilotAgentMode === "coding" ? "main" : state.copilotAgentMode,
      }
    }),
  queueSilentPredictionRun: () => {
    const threadId = createCopilotThreadId()
    let requestId = 0
    set((state) => {
      requestId = state.silentRunRequestId + 1

      return {
        silentAgentId: PREDICTION_AGENT_ID,
        silentThreadId: threadId,
        silentStatus: "running",
        silentRunning: true,
        silentLastStartedAt: Date.now(),
        silentRunRequestId: requestId,
      }
    })
    return { requestId, threadId }
  },
  markSilentPredictionStopping: (requestId) => {
    let marked = false
    set((state) => {
      if (!state.silentRunning) {
        return {}
      }

      if (requestId != null && state.silentRunRequestId !== requestId) {
        return {}
      }

      if (state.silentStatus === "stopping") {
        return {}
      }

      marked = true
      return {
        silentStatus: "stopping",
      }
    })
    return marked
  },
  finishSilentPredictionRun: (requestId) => {
    let finished = false
    set((state) => {
      if (requestId != null && state.silentRunRequestId !== requestId) {
        return {}
      }

      if (!state.silentRunning) {
        return {}
      }

      finished = true
      return {
        silentAgentId: null,
        silentStatus: "idle",
        silentRunning: false,
      }
    })
    return finished
  },
  resetSilentPredictionSession: (requestId) =>
    set((state) => {
      if (requestId != null && state.silentRunRequestId !== requestId) {
        return {}
      }

      return {
        silentAgentId: null,
        silentThreadId: createCopilotThreadId(),
        silentStatus: "idle",
        silentRunning: false,
      }
    }),
  queuePendingHandoff: (handoff) =>
    set({
      pendingHandoff: {
        ...handoff,
        status: "queued",
      },
    }),
  markPendingHandoffSending: (id) => {
    let marked = false
    set((state) => {
      if (!state.pendingHandoff || state.pendingHandoff.id !== id || state.pendingHandoff.status !== "queued") {
        return {}
      }

      marked = true
      return {
        pendingHandoff: {
          ...state.pendingHandoff,
          status: "sending",
        },
      }
    })
    return marked
  },
  clearPendingHandoff: (id) =>
    set((state) =>
      state.pendingHandoff?.id === id
        ? {
            pendingHandoff: null,
          }
        : {}
    ),
  resetPendingHandoff: (id) =>
    set((state) =>
      state.pendingHandoff?.id === id
        ? {
            pendingHandoff: {
              ...state.pendingHandoff,
              status: "queued",
            },
          }
        : {}
    ),
}))
