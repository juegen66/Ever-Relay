"use client"

import { useCopilotReadable } from "@copilotkit/react-core"

import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

export function DesktopAgentContextProvider() {
  const windows = useDesktopWindowStore((state) => state.windows)
  const activeWindowId = useDesktopWindowStore((state) => state.activeWindowId)
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const actionLog = useDesktopActionLogStore((state) => state.actions)

  useCopilotReadable({
    description: "Current desktop state and recent user actions for AI analysis",
    value: {
      openWindows: windows.map((w) => ({
        id: w.id,
        appId: w.appId,
        title: w.fileName ?? w.folderName ?? w.appId,
        minimized: w.minimized,
      })),
      activeWindowId,
      activeApp: activeWindowId
        ? windows.find((w) => w.id === activeWindowId)?.appId ?? null
        : null,
      desktopItems: desktopFolders.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.itemType,
        parentId: f.parentId,
      })),
      recentActions: actionLog,
      currentTime: new Date().toISOString(),
    },
  })

  return null
}
