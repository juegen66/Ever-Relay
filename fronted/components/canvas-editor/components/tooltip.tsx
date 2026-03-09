import { MousePointer2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { type ActiveTools } from "../types"


interface TooltipComponentProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
}

export const TooltipComponent = ({ activeTool, onToolChange }: TooltipComponentProps) => {
    const isActive = activeTool === "Select"

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "transition-all duration-200 ease-in-out",
                            isActive && "bg-primary text-primary-foreground border-primary"
                        )}
                        onClick={() => onToolChange("Select")}
                    >
                        <MousePointer2 className={cn("size-5", isActive && "scale-110")} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-sm font-medium">Select</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}