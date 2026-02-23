
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ToolSidebarCloseProps {
    onClose: () => void;
}

export const ToolSidebarClose = ({ onClose }: ToolSidebarCloseProps) => {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 border-black/10 bg-white/85 text-neutral-900 shadow-sm backdrop-blur-xl hover:bg-black/5"
        >
            <X className="size-4" />
        </Button>
    )
}
