import {
    LayoutTemplate,
    Image,
    Type,
    Shapes,
    Sparkles,
    Settings,
    Ruler,
} from "lucide-react"
import { SidebarItem } from "./sidebar-item"
import { ActiveTools } from "../types"
interface SidebarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
}




export const Sidebar = (
    {
        activeTool,
        onToolChange,
    }: SidebarProps
) => {
    return (

        <div className="flex h-full min-h-[calc(100vh-136px)] w-32 shrink-0 flex-col overflow-auto border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <SidebarItem Icon={LayoutTemplate} Onclick={() => onToolChange("Templates")} isActive={activeTool === "Templates"} Label="Templates" />
            <SidebarItem Icon={Image} Onclick={() => onToolChange("Images")} isActive={activeTool === "Images"} Label="Image" />
            <SidebarItem Icon={Type} Onclick={() => onToolChange("Text")} isActive={activeTool === "Text"} Label="Text" />
            <SidebarItem Icon={Shapes} Onclick={() => onToolChange("Shapes")} isActive={activeTool === "Shapes"} Label="Shapes" />
            <SidebarItem Icon={Ruler} Onclick={() => onToolChange("CanvasSize")} isActive={activeTool === "CanvasSize"} Label="Canvas" />
            <SidebarItem Icon={Sparkles} Onclick={() => onToolChange("AI")} isActive={activeTool === "AI"} Label="AI" />
            <SidebarItem Icon={Settings} Onclick={() => onToolChange("Settings")} isActive={activeTool === "Settings"} Label="Settings" />
        </div>
    )
}
