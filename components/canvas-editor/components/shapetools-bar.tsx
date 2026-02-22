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
                "border-border bg-background hover:bg-secondary hover:scale-105 hover:shadow-md",
                "active:scale-95",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive && "bg-primary text-primary-foreground border-primary shadow-md scale-105"
            )}
        >
            <Icon className={cn(
                "size-5 transition-transform duration-200",
                isActive && "scale-110"
            )} />
        </Button>
    );
};
