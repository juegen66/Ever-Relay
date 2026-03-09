"use client"

import { create } from "zustand"

export type DesktopActionInput =
  | { type: "app_opened"; appId: string }
  | { type: "file_opened"; fileId: string; fileName: string }
  | { type: "file_edited"; fileId: string; fileName?: string }
  | { type: "window_closed"; appId: string; title?: string }
  | { type: "folder_opened"; folderId: string; folderName: string }
  | { type: "spotlight_searched"; query: string }
  | { type: "canvas_project_opened"; projectId: string; projectName?: string }
  | { type: "context_menu_action"; action: string }

export type DesktopAction = DesktopActionInput & { ts: number }

const MAX_ACTIONS = 50

interface DesktopActionLogStore {
  actions: DesktopAction[]
  logAction: (action: DesktopActionInput) => void
  getSerializableLog: () => DesktopAction[]
  clear: () => void
}

export const useDesktopActionLogStore = create<DesktopActionLogStore>((set, get) => ({
  actions: [],
  logAction: (action) =>
    set((state) => ({
      actions: [...state.actions, { ...action, ts: Date.now() } as DesktopAction].slice(-MAX_ACTIONS),
    })),
  getSerializableLog: () => get().actions,
  clear: () => set({ actions: [] }),
}))
