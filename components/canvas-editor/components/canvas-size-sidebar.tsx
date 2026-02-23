import { useEffect, useState } from "react"
import { ActiveTools } from "../types"
import { ToolSidebarClose } from "./tool-sidebar-close"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditorType } from "../hooks/use-Editor"

interface CanvasSizeSidebarProps {
    activeTool: ActiveTools
    onToolChange: (tool: ActiveTools) => void
    editor: EditorType | null
}

const DEFAULT_WORKSPACE_WIDTH = 595
const DEFAULT_WORKSPACE_HEIGHT = 842

export const CanvasSizeSidebar = ({
    activeTool,
    onToolChange,
    editor,
}: CanvasSizeSidebarProps) => {
    const [workspaceWidth, setWorkspaceWidth] = useState<number>(() => editor?.getWorkspaceSize()?.width ?? DEFAULT_WORKSPACE_WIDTH)
    const [workspaceHeight, setWorkspaceHeight] = useState<number>(() => editor?.getWorkspaceSize()?.height ?? DEFAULT_WORKSPACE_HEIGHT)

    useEffect(() => {
        const workspaceSize = editor?.getWorkspaceSize()
        if (!workspaceSize) return
        setWorkspaceWidth(Math.round(workspaceSize.width))
        setWorkspaceHeight(Math.round(workspaceSize.height))
    }, [editor])

    if (activeTool !== "CanvasSize") {
        return null
    }

    const handleClose = () => {
        onToolChange("Select")
    }

    const handleWorkspaceWidthChange = (value: string) => {
        const nextWidth = Number(value)
        if (Number.isNaN(nextWidth)) return
        const normalizedWidth = Math.max(120, Math.min(4000, nextWidth))
        setWorkspaceWidth(normalizedWidth)
        editor?.setWorkspaceSize(normalizedWidth, workspaceHeight)
    }

    const handleWorkspaceHeightChange = (value: string) => {
        const nextHeight = Number(value)
        if (Number.isNaN(nextHeight)) return
        const normalizedHeight = Math.max(120, Math.min(4000, nextHeight))
        setWorkspaceHeight(normalizedHeight)
        editor?.setWorkspaceSize(workspaceWidth, normalizedHeight)
    }

    return (
        <aside className="relative flex h-full min-h-[calc(100vh-136px)] w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Canvas Size (px)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Width</span>
                            <input
                                type="number"
                                min={120}
                                max={4000}
                                value={workspaceWidth}
                                onChange={(event) => handleWorkspaceWidthChange(event.target.value)}
                                className="h-9 rounded border border-black/10 bg-white/70 px-2 text-sm text-neutral-900 outline-none focus:border-[#0058d0] focus:ring-2 focus:ring-[#0058d0]/20"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Height</span>
                            <input
                                type="number"
                                min={120}
                                max={4000}
                                value={workspaceHeight}
                                onChange={(event) => handleWorkspaceHeightChange(event.target.value)}
                                className="h-9 rounded border border-black/10 bg-white/70 px-2 text-sm text-neutral-900 outline-none focus:border-[#0058d0] focus:ring-2 focus:ring-[#0058d0]/20"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Min: 120px, Max: 4000px
                    </p>
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    )
}
