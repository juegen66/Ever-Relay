import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActiveTools, STROKE_WIDTH, DEFAULT_STROKE_STYLE, type StrokeStyle } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorType } from "../hooks/use-Editor";

interface StrokeStyleSidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
    selectedObjects: fabric.Object[];
}

const getObjectStrokeWidth = (object: fabric.Object): number | undefined => {
    const width = object.get("strokeWidth");
    return typeof width === "number" ? width : undefined;
};

const getObjectStrokeStyle = (object: fabric.Object): StrokeStyle => {
    const dash = object.get("strokeDashArray");
    if (!Array.isArray(dash) || dash.length === 0) {
        return DEFAULT_STROKE_STYLE;
    }

    const dashSignature = dash.join(",");
    switch (dashSignature) {
        case "12,6":
            return "dashed";
        case "2,4":
            return "dotted";
        default:
            return DEFAULT_STROKE_STYLE;
    }
};

const LINE_TYPE_OPTIONS: Array<{ id: StrokeStyle; label: string }> = [
    { id: "solid", label: "Solid" },
    { id: "dashed", label: "Dashed" },
    { id: "dotted", label: "Dotted" },
];

export const StrokeStyleSidebar = ({
    activeTool,
    onToolChange,
    editor,
    selectedObjects,
}: StrokeStyleSidebarProps) => {
    const hasSelection = selectedObjects.length > 0;

    const currentSelectionStrokeWidth = useMemo(() => {
        if (!hasSelection) return undefined;
        return getObjectStrokeWidth(selectedObjects[0]);
    }, [hasSelection, selectedObjects]);

    const currentSelectionStrokeStyle = useMemo<StrokeStyle>(() => {
        if (!hasSelection) return DEFAULT_STROKE_STYLE;
        return getObjectStrokeStyle(selectedObjects[0]);
    }, [hasSelection, selectedObjects]);

    const [strokeWidthValue, setStrokeWidthValue] = useState<number>(() => currentSelectionStrokeWidth ?? STROKE_WIDTH);
    const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>(() => currentSelectionStrokeStyle);

    useEffect(() => {
        if (typeof currentSelectionStrokeWidth === "number") {
            setStrokeWidthValue(currentSelectionStrokeWidth);
        }
    }, [currentSelectionStrokeWidth]);

    useEffect(() => {
        setStrokeStyle(currentSelectionStrokeStyle);
    }, [currentSelectionStrokeStyle]);

    if (activeTool !== "StrokeStyle") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    const handleStrokeWidthChange = (value: number) => {
        const normalizedValue = Math.max(0, value);
        setStrokeWidthValue(normalizedValue);
        editor?.setStrokeWidth(normalizedValue);
    };

    const handleStrokeStyleChange = (style: StrokeStyle) => {
        setStrokeStyle(style);
        editor?.setStrokeStyle(style);
    };

    return (
        <aside className="relative flex h-full min-h-[calc(100vh-136px)] w-60 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Stroke Width
                    </div>
                    <div className="flex items-center gap-x-2">
                        <input
                            type="range"
                            min={0}
                            max={200}
                            value={strokeWidthValue}
                            disabled={!hasSelection}
                            onChange={(event) => handleStrokeWidthChange(Number(event.target.value))}
                            className="w-full"
                        />
                        <input
                            type="number"
                            min={0}
                            max={200}
                            value={strokeWidthValue}
                            disabled={!hasSelection}
                            onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                handleStrokeWidthChange(Number.isNaN(nextValue) ? strokeWidthValue : nextValue);
                            }}
                            className="w-16 rounded border border-input px-2 py-1 text-sm text-right"
                        />
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Stroke Style
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {LINE_TYPE_OPTIONS.map(({ id, label }) => (
                                <Button
                                    key={id}
                                    type="button"
                                    variant={strokeStyle === id ? "default" : "outline"}
                                    size="sm"
                                    disabled={!hasSelection}
                                    onClick={() => handleStrokeStyleChange(id)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {!hasSelection && (
                        <p className="text-xs text-muted-foreground">
                            Select an object to adjust stroke width and style.
                        </p>
                    )}
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    );
};
