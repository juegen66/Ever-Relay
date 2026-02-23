"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ActiveTools } from "../types"
import type { EditorType } from "../hooks/use-Editor"
import { ToolSidebarClose } from "./tool-sidebar-close"
import { Button } from "@/components/ui/button"

interface TemplatesSidebarProps {
  activeTool: ActiveTools
  onToolChange: (tool: ActiveTools) => void
  editor: EditorType | null
}

export const TemplatesSidebar = ({
  activeTool,
  onToolChange,
  editor,
}: TemplatesSidebarProps) => {
  if (activeTool !== "Templates") {
    return null
  }

  const handleClose = () => {
    onToolChange("Select")
  }

  return (
    <aside className="relative flex h-full min-h-[calc(100vh-136px)] w-72 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Templates</h3>
          <Button
            variant="outline"
            className="justify-start border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
            onClick={() => {
              editor?.addHeadingText()
              onToolChange("Text")
            }}
          >
            Hero Title
          </Button>
          <Button
            variant="outline"
            className="justify-start border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
            onClick={() => {
              editor?.addRectangle()
              onToolChange("Shapes")
            }}
          >
            Card Block
          </Button>
          <Button
            variant="outline"
            className="justify-start border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
            onClick={() => {
              editor?.setWorkspaceSize(1080, 1080)
              onToolChange("CanvasSize")
            }}
          >
            Square Post (1080x1080)
          </Button>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClose={handleClose} />
    </aside>
  )
}
