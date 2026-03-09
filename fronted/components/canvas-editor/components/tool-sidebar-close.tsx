import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ToolSidebarCloseProps {
    onClose: () => void
}

export const ToolSidebarClose = ({ onClose }: ToolSidebarCloseProps) => {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="absolute -right-4 top-1/2 z-50 -translate-y-1/2 border-black/10 bg-white/85 text-neutral-900 shadow-sm backdrop-blur-xl hover:bg-black/5"
        >
            <X className="size-4" />
        </Button>
    )
}
