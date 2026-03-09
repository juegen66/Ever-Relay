import { Square, Circle, Triangle, Diamond, Star, Heart } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

import { type ActiveTools } from "../types";
import { ShapeToolbar } from "./shapetools-bar";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { type EditorType } from "../hooks/use-Editor";

interface ShapesSidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
}


export const ShapesSidebar = ({ activeTool, onToolChange, editor }: ShapesSidebarProps) => {
    if (activeTool !== "Shapes") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    return (
        <aside className="relative z-20 flex h-full min-h-0 w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-2 gap-3">
                    <ShapeToolbar Icon={Square} onClick={() => editor?.addRectangle()} />
                    <ShapeToolbar Icon={Circle} onClick={() => editor?.addCircle()} />
                    <ShapeToolbar Icon={Triangle} onClick={() => editor?.addTriangle()} />
                    <ShapeToolbar Icon={Diamond} onClick={() => editor?.addDiamond()} />
                    <ShapeToolbar Icon={Star} onClick={() => editor?.addStar()} />
                    <ShapeToolbar Icon={Heart} onClick={() => editor?.addHeart()} />
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside >
    )

}
