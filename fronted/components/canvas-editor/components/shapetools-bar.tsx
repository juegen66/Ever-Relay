import { type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShapeToolbarProps {
    Icon: LucideIcon;
    onClick: () => void;
    isActive?: boolean;
}

export const ShapeToolbar = ({
    Icon,
    onClick,
    isActive = false
}: ShapeToolbarProps) => {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            className={cn(
                "w-16 h-16 transition-all duration-200 ease-in-out",
                "border-black/10 bg-white/80 text-neutral-700 shadow-sm backdrop-blur-xl hover:scale-105 hover:bg-black/5 hover:text-neutral-900 hover:shadow-md",
                "active:scale-95",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive && "scale-105 border-[#0058d0] bg-[#0058d0] text-white shadow-lg shadow-black/10"
            )}
        >
            <Icon className={cn(
                "size-5 transition-transform duration-200",
                isActive && "scale-110"
            )} />
        </Button>
    );
};
