"use client"

import { create } from "zustand"

import type { CodingApp } from "@/shared/contracts/coding-apps"
import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"

export type CopilotAgentMode = "main" | "logo" | "coding"
export type ActiveCodingApp = Pick<
  CodingApp,
  "id" | "name" | "description" | "threadId" | "sandboxId" | "status" | "lastOpenedAt"
>

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
  silentRunning: boolean
  silentLastStartedAt: number | null
  silentRunRequestId: number
  setCopilotSidebarOpen: (open: boolean) => void
  setCopilotAgentMode: (mode: CopilotAgentMode) => void
  startNewCopilotThread: () => void
  setActiveCodingApp: (app: ActiveCodingApp) => void
  syncActiveCodingApp: (app: ActiveCodingApp) => void
  clearActiveCodingApp: (options?: { freshMainThread?: boolean }) => void
  queueSilentPredictionRun: () => string
  finishSilentPredictionRun: () => void
  resetSilentPredictionSession: () => void
}

export const useDesktopAgentStore = create<DesktopAgentStore>((set) => ({
  copilotSidebarOpen: false,
  copilotAgentMode: "main",
  mainCopilotThreadId: initialMainCopilotThreadId,
  copilotThreadId: initialMainCopilotThreadId,
  activeCodingApp: null,
  silentAgentId: null,
  silentThreadId: createCopilotThreadId(),
  silentRunning: false,
  silentLastStartedAt: null,
  silentRunRequestId: 0,
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
    set((state) => ({
      silentAgentId: PREDICTION_AGENT_ID,
      silentThreadId: threadId,
      silentRunning: true,
      silentLastStartedAt: Date.now(),
      silentRunRequestId: state.silentRunRequestId + 1,
    }))
    return threadId
  },
  finishSilentPredictionRun: () =>
    set({
      silentAgentId: null,
      silentRunning: false,
    }),
  resetSilentPredictionSession: () =>
    set({
      silentAgentId: null,
      silentRunning: false,
    }),
}))
