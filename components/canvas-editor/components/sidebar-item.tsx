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
                "h-auto w-full justify-start text-sm font-medium text-neutral-700",
                "transition-all duration-200 ease-in-out",
                "hover:bg-black/5 hover:text-neutral-900",
                "rounded-md py-3 px-2",
                isActive && "bg-[#0058d0] text-white font-semibold shadow-sm hover:bg-[#0058d0] hover:text-white"
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
