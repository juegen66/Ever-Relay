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
  // Window operations
  | { type: "window_focused"; windowId: string; appId: string }
  | { type: "window_minimized"; windowId: string; appId: string }
  | { type: "window_maximized"; windowId: string; appId: string }
  // Dock
  | { type: "dock_item_clicked"; itemId: string; itemName: string }
  // Launchpad
  | { type: "launchpad_app_clicked"; appId: string; appName: string }
  // MenuBar
  | { type: "menubar_action"; menu: string; action: string }
  // Control Center
  | { type: "control_center_toggled"; control: string; value: boolean | number }
  // Desktop icons
  | { type: "desktop_icon_selected"; itemId: string; itemName: string }
  | { type: "desktop_icon_context_menu"; itemId: string; action: string }
  // Notifications
  | { type: "notification_dismissed"; notificationId: string }
  // Dialogs
  | { type: "dialog_opened"; dialogId: string }
  | { type: "dialog_closed"; dialogId: string }
  // Keyboard shortcuts
  | { type: "keyboard_shortcut"; shortcut: string; action: string }

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
