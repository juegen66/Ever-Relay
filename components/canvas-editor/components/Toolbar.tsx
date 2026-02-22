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

export default function Toolbar({ activeTool, onToolChange, editor, hasSelection }: ToolbarProps) {
    const handleClearCanvas = () => {
        if (!editor) return
        editor.clearCanvas()
    }

    return (
        <div className="h-[68px] bg-background overflow-x-auto border-b border-border shrink-0 flex items-center gap-x-4 px-4">
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
                            className={`flex items-center justify-center border-[#8fa889] transition-transform duration-150 hover:scale-105 ${isActive
                                ? "bg-[#5f7d5f] text-[#f6f1e6] hover:bg-[#4e694e]"
                                : "bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8]"
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
                    className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8] disabled:opacity-40"
                    onClick={() => editor?.bringForward()}
                >
                    <ArrowUp className="size-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    title="Send Backward"
                    disabled={!hasSelection || !editor}
                    className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8] disabled:opacity-40"
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
                            className="border-[#5f7d5f] text-[#2f4f2f] hover:bg-[#eef4e8]"
                            disabled={!editor}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#2f4f2f]">
                                Clear the canvas?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#4f664f]">
                                This will remove all objects from the current canvas. You can restore it with Undo.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8]">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearCanvas}
                                className="bg-[#5f7d5f] text-[#f6f1e6] hover:bg-[#4e694e]"
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
