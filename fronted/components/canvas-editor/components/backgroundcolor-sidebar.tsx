import { useEffect, useState } from "react";
import { ChromePicker, type ColorResult } from "react-color";
import { ActiveTools } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorType } from "../hooks/use-Editor";

interface BackgroundColorSidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
}

const toRgbaString = (color: ColorResult["rgb"]) =>
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;

const DEFAULT_BACKGROUND = "rgba(255, 255, 255, 1)";

export const BackgroundColorSidebar = ({
    activeTool,
    onToolChange,
    editor,
}: BackgroundColorSidebarProps) => {
    const [pickerColor, setPickerColor] = useState<string>(() => editor?.getWorkspaceBackground() ?? DEFAULT_BACKGROUND);

    useEffect(() => {
        const workspaceColor = editor?.getWorkspaceBackground();
        if (workspaceColor) {
            setPickerColor(workspaceColor);
        }
    }, [editor]);

    if (activeTool !== "Background") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    const handleBackgroundChange = (color: ColorResult) => {
        const nextColor = toRgbaString(color.rgb);
        setPickerColor(nextColor);
        editor?.setWorkspaceBackground(nextColor);
    };

    return (
        <aside className="relative z-20 flex h-full min-h-0 w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Canvas Background
                    </div>
                    <ChromePicker
                        disableAlpha={false}
                        color={pickerColor}
                        onChange={handleBackgroundChange}
                    />
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    );
};
