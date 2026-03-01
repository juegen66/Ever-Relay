"use client"

import { create } from "zustand"

type ContextMenuState = { x: number; y: number } | null
export type CopilotAgentMode = "main" | "logo"

function createCopilotThreadId() {
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
  closeTransientUi: () =>
    set({
      contextMenu: null,
      showSpotlight: false,
      showLaunchpad: false,
    }),
}))
