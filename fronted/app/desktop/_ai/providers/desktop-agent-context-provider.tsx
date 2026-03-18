"use client"

import { useCopilotReadable } from "@copilotkit/react-core"

import { useLongTermMemory } from "@/hooks/use-long-term-memory"
import { useWorkingMemory } from "@/hooks/use-working-memory"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

function WorkingMemoryContextSync() {
  useWorkingMemory()
  return null
}

interface DesktopAgentContextProviderProps {
  includeWorkingMemory?: boolean
}

export function DesktopAgentContextProvider({
  includeWorkingMemory = true,
}: DesktopAgentContextProviderProps = {}) {
  const windows = useDesktopWindowStore((state) => state.windows)
  const activeWindowId = useDesktopWindowStore((state) => state.activeWindowId)
  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const actionLog = useDesktopActionLogStore((state) => state.actions)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)

  const { facts, patterns, episodes } = useLongTermMemory()

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
    description: "Recent desktop actions",
    value: {
      recentActions: actionLog,
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

  useCopilotReadable({
    description:
      "Long-term user memory from AFS (Agentic File System). " +
      "User memories are preferences/habits from Desktop/Memory/user. " +
      "Notes are observations and session summaries from Desktop/Memory/note. " +
      "Use these to personalize predictions.",
    value: {
      userMemories: facts.map((n) => ({ path: n.path, content: n.content, confidence: n.metadata?.confidence })),
      notes: patterns.map((n) => ({ path: n.path, content: n.content, confidence: n.metadata?.confidence })),
      recentNotes: episodes.map((n) => ({ path: n.path, content: n.content })),
    },
  })

  return includeWorkingMemory ? <WorkingMemoryContextSync /> : null
}
