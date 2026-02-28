import { useEffect, useMemo, useState } from "react";
import { ChromePicker, type ColorResult } from "react-color";
import { ActiveTools, FILL_COLORS } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorType } from "../hooks/use-Editor";

interface FillColorSidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
    selectedObjects: fabric.Object[];
}

const toRgbaString = (color: ColorResult["rgb"]) =>
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;

const getObjectFill = (object: fabric.Object): string | undefined => {
    const fill = object.get("fill");
    return typeof fill === "string" ? fill : undefined;
};

export const FillColorSidebar = ({ activeTool, onToolChange, editor, selectedObjects }: FillColorSidebarProps) => {
    const hasSelection = selectedObjects.length > 0;

    const currentSelectionFill = useMemo(() => {
        if (!hasSelection) return undefined;
        return getObjectFill(selectedObjects[0]);
    }, [hasSelection, selectedObjects]);

    const [pickerColor, setPickerColor] = useState<string>(() => currentSelectionFill ?? FILL_COLORS);

    useEffect(() => {
        if (currentSelectionFill) {
            setPickerColor(currentSelectionFill);
        }
    }, [currentSelectionFill]);

    if (activeTool !== "Fill") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    const handleFillChange = (color: ColorResult) => {
        const nextColor = toRgbaString(color.rgb);
        setPickerColor(nextColor);
        editor?.setFillColor(nextColor);
    };

    return (
        <aside className="relative z-20 flex h-full min-h-0 w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Fill Color
                    </div>
                    <ChromePicker
                        disableAlpha={false}
                        color={pickerColor}
                        onChange={handleFillChange}
                    />
                    {!hasSelection && (
                        <p className="text-xs text-muted-foreground">
                            Select an object to apply fill color.
                        </p>
                    )}
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside >
    )
}
