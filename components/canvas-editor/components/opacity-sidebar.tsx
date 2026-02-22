import { useEffect, useMemo, useState } from "react";
import { ActiveTools, OPACITY } from "../types";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorType } from "../hooks/use-Editor";

interface OpacitySidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
    selectedObjects: fabric.Object[];
}

const getObjectOpacity = (object: fabric.Object): number | undefined => {
    const opacity = object.get("opacity");
    return typeof opacity === "number" ? opacity : undefined;
};

export const OpacitySidebar = ({
    activeTool,
    onToolChange,
    editor,
    selectedObjects,
}: OpacitySidebarProps) => {
    const hasSelection = selectedObjects.length > 0;

    const currentOpacity = useMemo(() => {
        if (!hasSelection) return undefined;
        return getObjectOpacity(selectedObjects[0]);
    }, [hasSelection, selectedObjects]);

    const [opacityPercent, setOpacityPercent] = useState<number>(() => (currentOpacity ?? OPACITY) * 100);

    useEffect(() => {
        if (typeof currentOpacity === "number") {
            setOpacityPercent(Math.round(currentOpacity * 100));
        }
    }, [currentOpacity]);

    if (activeTool !== "Opacity") {
        return null;
    }

    const handleClose = () => {
        onToolChange("Select");
    };

    const handleOpacityChange = (percent: number) => {
        const clampedPercent = Math.max(0, Math.min(100, percent));
        setOpacityPercent(clampedPercent);
        editor?.setOpacity(clampedPercent / 100);
    };

    return (
        <aside className="h-full w-60 shrink-0 flex flex-col gap-y-4 border-r border-border bg-background min-h-[calc(100vh-136px)] relative">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Opacity
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <div className="flex items-center gap-x-2">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={opacityPercent}
                                disabled={!hasSelection}
                                onChange={(event) => handleOpacityChange(Number(event.target.value))}
                                className="w-full"
                            />
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={opacityPercent}
                                disabled={!hasSelection}
                                onChange={(event) => handleOpacityChange(Number(event.target.value))}
                                className="w-16 rounded border border-input px-2 py-1 text-sm text-right"
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {hasSelection ? `${opacityPercent}% opacity` : "Select an object to adjust opacity."}
                        </span>
                    </div>
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    );
};

