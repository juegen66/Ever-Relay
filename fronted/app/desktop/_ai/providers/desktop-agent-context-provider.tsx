"use client"

import { useCopilotReadable } from "@copilotkit/react-core"

import { useWorkingMemory } from "@/hooks/use-working-memory"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

export function DesktopAgentContextProvider() {
  const windows = useDesktopWindowStore((state) => state.windows)
  const activeWindowId = useDesktopWindowStore((state) => state.activeWindowId)
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const actionLog = useDesktopActionLogStore((state) => state.actions)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)

  useWorkingMemory()

  useCopilotReadable({
    description: "Current desktop window state",
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
    },
  })

  useCopilotReadable({
    description: "Current desktop items",
    value: {
      desktopItems: desktopFolders.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.itemType,
        parentId: f.parentId,
      })),
    },
  })

  useCopilotReadable({
    description: "Recent desktop actions and time",
    value: {
      recentActions: actionLog,
      currentTime: new Date().toISOString(),
    },
  })

  useCopilotReadable({
    description: "Active coding app context for sidebar work",
    value: {
      activeCodingApp: activeCodingApp
        ? {
            id: activeCodingApp.id,
            name: activeCodingApp.name,
            description: activeCodingApp.description ?? null,
            status: activeCodingApp.status,
            lastOpenedAt: activeCodingApp.lastOpenedAt ?? null,
          }
        : null,
    },
  })

  return null
}
