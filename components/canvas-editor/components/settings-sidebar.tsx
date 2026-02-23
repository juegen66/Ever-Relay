"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ActiveTools } from "../types"
import { ToolSidebarClose } from "./tool-sidebar-close"

interface SettingsSidebarProps {
  activeTool: ActiveTools
  onToolChange: (tool: ActiveTools) => void
}

export const SettingsSidebar = ({ activeTool, onToolChange }: SettingsSidebarProps) => {
  if (activeTool !== "Settings") {
    return null
  }

  const handleClose = () => {
    onToolChange("Select")
  }

  return (
    <aside className="relative flex h-full min-h-[calc(100vh-136px)] w-72 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
      <ScrollArea className="h-full p-4">
        <div className="rounded-lg border border-dashed border-black/15 bg-white/70 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">Editor Settings</h3>
          <p className="mt-2 text-xs text-neutral-600">
            Settings panel placeholder. Canvas sizing, colors, and object styles are available in the current tool panels.
          </p>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClose={handleClose} />
    </aside>
  )
}
