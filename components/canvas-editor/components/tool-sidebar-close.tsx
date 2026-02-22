
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
            className="absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-1/2 border-border bg-background text-foreground hover:bg-secondary"
        >
            <X className="size-4" />
        </Button>
    )
}
