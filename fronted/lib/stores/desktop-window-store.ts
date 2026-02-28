"use client"

import { create } from "zustand"
import type { AppId, WindowState } from "@/app/desktop/components/macos/types"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"

const DEFAULT_WINDOW_SIZE: Record<AppId, { w: number; h: number }> = {
  finder: { w: 780, h: 480 },
  calculator: { w: 260, h: 400 },
  notes: { w: 680, h: 500 },
  terminal: { w: 660, h: 440 },
  safari: { w: 900, h: 580 },
  settings: { w: 740, h: 520 },
  photos: { w: 780, h: 540 },
  music: { w: 820, h: 520 },
  calendar: { w: 760, h: 520 },
  mail: { w: 820, h: 540 },
  weather: { w: 420, h: 520 },
  clock: { w: 340, h: 380 },
  maps: { w: 780, h: 520 },
  appstore: { w: 820, h: 560 },
  messages: { w: 700, h: 500 },
  canvas: { w: 1160, h: 760 },
  vibecoding: { w: 980, h: 640 },
  textedit: { w: 720, h: 520 },
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

function getDesktopViewportSize() {
  const { width, height } = getViewportSize()
  const { copilotSidebarOpen } = useDesktopUIStore.getState()
  const sidebarInset = copilotSidebarOpen && width >= 640 ? width * 0.25 : 0

  return {
    width: Math.max(320, width - sidebarInset),
    height,
  }
}

function getInitialWindowBounds(
  desiredWidth: number,
  desiredHeight: number,
  offset: number
) {
  const { width: viewW, height: viewH } = getDesktopViewportSize()
  const width = Math.min(desiredWidth, Math.max(300, viewW - 24))
  const height = Math.min(desiredHeight, Math.max(200, viewH - 24))
  const x = Math.max(0, Math.min((viewW - width) / 2 + offset, viewW - width))
  const y = Math.max(0, Math.min((viewH - height) / 2 - 60 + offset, viewH - height))

  return { x, y, width, height }
}

interface DesktopWindowStore {
  windows: WindowState[]
  nextZIndex: number
  activeWindowId: string | null
  bouncingApp: AppId | null
  openApp: (appId: AppId) => void
  openFolderWindow: (folderId: string, folderName: string) => void
  openFileWindow: (fileId: string, fileName: string) => void
  focusWindow: (id: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  fitWindowsToViewport: () => void
  clearActiveWindow: () => void
}

export const useDesktopWindowStore = create<DesktopWindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,
  activeWindowId: null,
  bouncingApp: null,
  openApp: (appId) => {
    useDesktopUIStore.getState().closeTransientUi()
    const { windows, nextZIndex } = get()

    const existing = windows.find((w) => w.appId === appId && !w.minimized)
    if (existing) {
      get().focusWindow(existing.id)
      return
    }

    const minimized = windows.find((w) => w.appId === appId && w.minimized)
    if (minimized) {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === minimized.id ? { ...w, minimized: false, zIndex: state.nextZIndex } : w
        ),
        activeWindowId: minimized.id,
        nextZIndex: state.nextZIndex + 1,
      }))
      return
    }

    set({ bouncingApp: appId })
    setTimeout(() => {
      set((state) => (state.bouncingApp === appId ? { bouncingApp: null } : {}))
    }, 600)

    const size = DEFAULT_WINDOW_SIZE[appId] || { w: 600, h: 400 }
    const id = `${appId}-${Date.now()}`
    const offset = (windows.length % 6) * 28
    const bounds = getInitialWindowBounds(size.w, size.h, offset)
    const newWindow: WindowState = {
      id,
      appId,
      ...bounds,
      zIndex: nextZIndex,
      minimized: false,
      maximized: false,
    }

    set((state) => ({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }))
  },
  openFolderWindow: (folderId, folderName) => {
    useDesktopUIStore.getState().closeTransientUi()
    const { windows, nextZIndex } = get()
    const existing = windows.find(
      (w) => w.appId === "finder" && w.folderId === folderId && !w.minimized
    )
    if (existing) {
      get().focusWindow(existing.id)
      return
    }

    const size = DEFAULT_WINDOW_SIZE.finder
    const id = `finder-folder-${Date.now()}`
    const offset = (windows.length % 6) * 28
    const bounds = getInitialWindowBounds(size.w, size.h, offset)
    const newWindow: WindowState = {
      id,
      appId: "finder",
      ...bounds,
      zIndex: nextZIndex,
      minimized: false,
      maximized: false,
      folderId,
      folderName,
    }

    set((state) => ({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }))
  },
  openFileWindow: (fileId, fileName) => {
    useDesktopUIStore.getState().closeTransientUi()
    const { windows, nextZIndex } = get()
    const existing = windows.find(
      (w) => w.appId === "textedit" && w.fileId === fileId && !w.minimized
    )
    if (existing) {
      get().focusWindow(existing.id)
      return
    }

    const size = DEFAULT_WINDOW_SIZE.textedit
    const id = `textedit-file-${Date.now()}`
    const offset = (windows.length % 6) * 28
    const bounds = getInitialWindowBounds(size.w, size.h, offset)
    const newWindow: WindowState = {
      id,
      appId: "textedit",
      ...bounds,
      zIndex: nextZIndex,
      minimized: false,
      maximized: false,
      fileId,
      fileName,
    }

    set((state) => ({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }))
  },
  focusWindow: (id) =>
    set((state) => {
      if (state.activeWindowId === id) return state

      return {
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, zIndex: state.nextZIndex } : w
        ),
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      }
    }),
  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),
  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),
  maximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.prevBounds?.x ?? w.x,
            y: w.prevBounds?.y ?? w.y,
            width: w.prevBounds?.width ?? w.width,
            height: w.prevBounds?.height ?? w.height,
          }
        }
        return {
          ...w,
          maximized: true,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
        }
      }),
    })),
  updateWindowPosition: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),
  updateWindowSize: (id, width, height) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    })),
  fitWindowsToViewport: () =>
    set((state) => {
      const { width: viewW, height: viewH } = getDesktopViewportSize()

      return {
        windows: state.windows.map((w) => {
          if (w.maximized) {
            return w
          }

          const width = Math.min(w.width, Math.max(300, viewW - 24))
          const height = Math.min(w.height, Math.max(200, viewH - 24))
          const x = Math.max(0, Math.min(w.x, viewW - width))
          const y = Math.max(0, Math.min(w.y, viewH - height))

          if (x === w.x && y === w.y && width === w.width && height === w.height) {
            return w
          }

          return {
            ...w,
            x,
            y,
            width,
            height,
          }
        }),
      }
    }),
  clearActiveWindow: () => set({ activeWindowId: null }),
}))
