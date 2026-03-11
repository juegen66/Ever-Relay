"use client"

import { create } from "zustand"

type ContextMenuState = { x: number; y: number } | null

interface DesktopUIStore {
  contextMenu: ContextMenuState
  showSpotlight: boolean
  showLaunchpad: boolean
  showAboutMac: boolean
  setContextMenu: (menu: ContextMenuState) => void
  closeContextMenu: () => void
  toggleSpotlight: () => void
  closeSpotlight: () => void
  setShowLaunchpad: (show: boolean) => void
  closeLaunchpad: () => void
  setShowAboutMac: (show: boolean) => void
  closeTransientUi: () => void
}

export const useDesktopUIStore = create<DesktopUIStore>((set) => ({
  contextMenu: null,
  showSpotlight: false,
  showLaunchpad: false,
  showAboutMac: false,
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
  closeTransientUi: () =>
    set({
      contextMenu: null,
      showSpotlight: false,
      showLaunchpad: false,
    }),
}))
