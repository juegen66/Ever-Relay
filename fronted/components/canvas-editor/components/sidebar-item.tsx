import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"


interface SidebarItemProps {
    Icon: LucideIcon
    Onclick: () => void
    isActive?: boolean
    Label: string
    compact?: boolean
}

export const SidebarItem = ({ Icon, Onclick, isActive, Label, compact = false }: SidebarItemProps) => {
    return (
        <Button
            variant="ghost"
            className={cn(
                "h-auto w-full justify-start text-sm font-medium text-neutral-700",
                "transition-all duration-200 ease-in-out",
                "hover:bg-black/5 hover:text-neutral-900",
                compact ? "rounded-md px-2 py-2" : "rounded-md px-2 py-3",
                isActive && "bg-[#0058d0] text-white font-semibold shadow-sm hover:bg-[#0058d0] hover:text-white"
            )}
            onClick={Onclick}
            title={Label}
        >
            <div className={cn("flex w-full items-center justify-center", compact ? "py-1" : "flex-col gap-1.5")}>
                <Icon className={cn("size-5 transition-all", isActive && "scale-110")} />
                {!compact && <span className="text-xs leading-tight">{Label}</span>}
            </div>
        </Button>
    )
}
