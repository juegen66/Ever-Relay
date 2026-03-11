"use client"

import { create } from "zustand"

import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"

type ContextMenuState = { x: number; y: number } | null
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

interface DesktopUIStore {
  contextMenu: ContextMenuState
  showSpotlight: boolean
  showLaunchpad: boolean
  showAboutMac: boolean
  copilotSidebarOpen: boolean
  copilotAgentMode: CopilotAgentMode
  copilotThreadId: string
  silentAgentId: string | null
  silentThreadId: string
  silentRunning: boolean
  silentLastStartedAt: number | null
  silentRunRequestId: number
  setContextMenu: (menu: ContextMenuState) => void
  closeContextMenu: () => void
  toggleSpotlight: () => void
  closeSpotlight: () => void
  setShowLaunchpad: (show: boolean) => void
  closeLaunchpad: () => void
  setShowAboutMac: (show: boolean) => void
  setCopilotSidebarOpen: (open: boolean) => void
  setCopilotAgentMode: (mode: CopilotAgentMode) => void
  startNewCopilotThread: () => void
  queueSilentPredictionRun: () => string
  finishSilentPredictionRun: () => void
  resetSilentPredictionSession: () => void
  closeTransientUi: () => void
}

export const useDesktopUIStore = create<DesktopUIStore>((set) => ({
  contextMenu: null,
  showSpotlight: false,
  showLaunchpad: false,
  showAboutMac: false,
  copilotSidebarOpen: false,
  copilotAgentMode: "main",
  copilotThreadId: createCopilotThreadId(),
  silentAgentId: null,
  silentThreadId: createCopilotThreadId(),
  silentRunning: false,
  silentLastStartedAt: null,
  silentRunRequestId: 0,
  setContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),
  toggleSpotlight: () =>
    set((state) => ({
      showSpotlight: !state.showSpotlight,
      showLaunchpad: false,
    })),
  closeSpotlight: () => set({ showSpotlight: false }),
  setShowLaunchpad: (show) =>
    set({
      showLaunchpad: show,
      showSpotlight: false,
    }),
  closeLaunchpad: () => set({ showLaunchpad: false }),
  setShowAboutMac: (show) => set({ showAboutMac: show }),
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
  closeTransientUi: () =>
    set({
      contextMenu: null,
      showSpotlight: false,
      showLaunchpad: false,
    }),
}))
