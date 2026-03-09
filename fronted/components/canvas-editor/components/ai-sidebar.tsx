"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import { type ActiveTools } from "../types"
import { ToolSidebarClose } from "./tool-sidebar-close"

interface AiSidebarProps {
  activeTool: ActiveTools
  onToolChange: (tool: ActiveTools) => void
}

export const AiSidebar = ({ activeTool, onToolChange }: AiSidebarProps) => {
  if (activeTool !== "AI") {
    return null
  }

  const handleClose = () => {
    onToolChange("Select")
  }

  return (
    <aside className="relative z-20 flex h-full min-h-0 w-72 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
      <ScrollArea className="h-full p-4">
        <div className="rounded-lg border border-dashed border-black/15 bg-white/70 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">AI Tools</h3>
          <p className="mt-2 text-xs text-neutral-600">
            AI panel is reserved. You can continue editing with Text, Shapes, and Images tools.
          </p>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClose={handleClose} />
    </aside>
  )
}
