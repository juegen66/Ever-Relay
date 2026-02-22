import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
    Icon: LucideIcon;
    Onclick: () => void;
    isActive?: boolean;
    Label: string;
}

export const SidebarItem = ({ Icon, Onclick, isActive, Label }: SidebarItemProps) => {
    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full h-auto justify-start text-muted-foreground text-sm font-medium",
                "transition-all duration-200 ease-in-out",
                "hover:text-primary hover:bg-primary/15",
                "rounded-md py-3 px-2",
                isActive && "text-primary bg-primary/20 font-semibold"
            )}
            onClick={Onclick}
        >
            <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                <Icon className={cn("size-5 transition-all", isActive && "scale-110")} />
                <span className="text-xs leading-tight">{Label}</span>
            </div>
        </Button>
    );
};
