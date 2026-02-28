import { useEffect, useMemo, useState } from "react";
import { ChromePicker, type ColorResult } from "react-color";
import { ActiveTools, STROKE_COLORS } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorType } from "../hooks/use-Editor";

interface StrokeColorSidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
    selectedObjects: fabric.Object[];
}

const toRgbaString = (color: ColorResult["rgb"]) =>
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;

const getObjectStroke = (object: fabric.Object): string | undefined => {
    const stroke = object.get("stroke");
    return typeof stroke === "string" ? stroke : undefined;
};




export const StrokeColorSidebar = ({
    activeTool,
    onToolChange,
    editor,
    selectedObjects,
}: StrokeColorSidebarProps) => {
    const hasSelection = selectedObjects.length > 0;

    const currentSelectionStroke = useMemo(() => {
        if (!hasSelection) return undefined;
        return getObjectStroke(selectedObjects[0]);
    }, [hasSelection, selectedObjects]);

    const [pickerColor, setPickerColor] = useState<string>(() => currentSelectionStroke ?? STROKE_COLORS);

    useEffect(() => {
        if (currentSelectionStroke) {
            setPickerColor(currentSelectionStroke);
        }
    }, [currentSelectionStroke]);

    if (activeTool !== "Stroke") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    const handleStrokeChange = (color: ColorResult) => {
        const nextColor = toRgbaString(color.rgb);
        setPickerColor(nextColor);
        editor?.setStrokeColor(nextColor);
    };

    return (
        <aside className="relative z-20 flex h-full min-h-0 w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Stroke Color
                    </div>
                    <ChromePicker
                        disableAlpha={false}
                        color={pickerColor}
                        onChange={handleStrokeChange}
                    />
                    {!hasSelection && (
                        <p className="text-xs text-muted-foreground">
                            Select an object to adjust its stroke color.
                        </p>
                    )}
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    );
};
