"use client"

import { create } from "zustand"

import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"

export type CopilotAgentMode = "main" | "logo"

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

interface DesktopAgentStore {
  copilotSidebarOpen: boolean
  copilotAgentMode: CopilotAgentMode
  copilotThreadId: string
  silentAgentId: string | null
  silentThreadId: string
  silentRunning: boolean
  silentLastStartedAt: number | null
  silentRunRequestId: number
  setCopilotSidebarOpen: (open: boolean) => void
  setCopilotAgentMode: (mode: CopilotAgentMode) => void
  startNewCopilotThread: () => void
  queueSilentPredictionRun: () => string
  finishSilentPredictionRun: () => void
  resetSilentPredictionSession: () => void
}

export const useDesktopAgentStore = create<DesktopAgentStore>((set) => ({
  copilotSidebarOpen: false,
  copilotAgentMode: "main",
  copilotThreadId: createCopilotThreadId(),
  silentAgentId: null,
  silentThreadId: createCopilotThreadId(),
  silentRunning: false,
  silentLastStartedAt: null,
  silentRunRequestId: 0,
  setCopilotSidebarOpen: (open) => set({ copilotSidebarOpen: open }),
  setCopilotAgentMode: (mode) => set({ copilotAgentMode: mode }),
  startNewCopilotThread: () => set({ copilotThreadId: createCopilotThreadId() }),
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
