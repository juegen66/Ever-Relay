import { ActiveTools } from "../types"
import { EditorType } from "../hooks/use-Editor"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PaintBucket, Square, Palette, Droplet, Ruler, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
interface ToolbarProps {
    activeTool: ActiveTools
    onToolChange: (tool: ActiveTools) => void
    editor: EditorType | null
    hasSelection: boolean
    compact?: boolean
}

type ToolbarTool = Extract<ActiveTools, "Fill" | "Stroke" | "StrokeStyle" | "Background" | "Opacity">

const TOOL_CONFIG: Array<{
    id: ToolbarTool
    label: string
    Icon: typeof PaintBucket
}> = [
        { id: "Fill", label: "Fill Color", Icon: PaintBucket },
        { id: "Stroke", label: "Stroke Color", Icon: Square },
        { id: "StrokeStyle", label: "Stroke Width & Style", Icon: Ruler },
        { id: "Background", label: "Canvas Background", Icon: Palette },
        { id: "Opacity", label: "Opacity", Icon: Droplet },
    ]

export default function Toolbar({ activeTool, onToolChange, editor, hasSelection, compact = false }: ToolbarProps) {
    const handleClearCanvas = () => {
        if (!editor) return
        editor.clearCanvas()
    }

    return (
        <div className={`flex shrink-0 items-center overflow-x-auto border-b border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150 ${compact ? "h-14 gap-x-2 px-3" : "h-[68px] gap-x-4 px-4"}`}>
            <div className="flex items-center gap-x-3">
                {TOOL_CONFIG.map(({ id, label, Icon }) => {
                    if (activeTool === "Text" && id === "Stroke") {
                        return null
                    }
                    const isActive = activeTool === id
                    return (
                        <Button
                            key={id}
                            variant={isActive ? "default" : "outline"}
                            size="icon"
                            title={label}
                            onClick={() => onToolChange(id)}
                            className={`flex items-center justify-center border-black/10 transition-transform duration-150 hover:scale-105 ${isActive
                                ? "bg-[#0058d0] text-white hover:bg-[#0045a6]"
                                : "bg-white/70 text-neutral-800 hover:bg-black/5"
                                }`}
                        >
                            <Icon className="size-4" />
                        </Button>
                    )
                })}
            </div>
            <div className="h-10 w-px bg-muted-foreground/30" />
            <div className="flex items-center gap-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    title="Bring Forward"
                    disabled={!hasSelection || !editor}
                    className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5 disabled:opacity-40"
                    onClick={() => editor?.bringForward()}
                >
                    <ArrowUp className="size-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    title="Send Backward"
                    disabled={!hasSelection || !editor}
                    className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5 disabled:opacity-40"
                    onClick={() => editor?.sendBackward()}
                >
                    <ArrowDown className="size-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            title="Clear Canvas"
                            className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
                            disabled={!editor}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-black/10 bg-white/90 text-neutral-900 shadow-lg shadow-black/10 backdrop-blur-xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-neutral-900">
                                Clear the canvas?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-600">
                                This will remove all objects from the current canvas. You can restore it with Undo.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearCanvas}
                                className="bg-[#0058d0] text-white hover:bg-[#0045a6]"
                            >
                                Clear
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
