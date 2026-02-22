import { ActiveTools } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShapeToolbar } from "./shapetools-bar";
import { Square, Circle, Triangle, Diamond, Star, Heart } from "lucide-react";
import { EditorType } from "../hooks/use-Editor";

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
        <aside className="h-full w-60 shrink-0 flex flex-col gap-y-4 border-r border-border bg-background min-h-[calc(100vh-136px)] relative">
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
