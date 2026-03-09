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
import { type ActiveTools } from "../types"
interface SidebarProps {
  activeTool: ActiveTools
  onToolChange: (tool: ActiveTools) => void
  compact?: boolean
}

export const Sidebar = (
  {
    activeTool,
    onToolChange,
    compact = false,
  }: SidebarProps
) => {
  return (
    <div className={`z-30 flex h-full min-h-0 shrink-0 flex-col overflow-auto border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150 ${compact ? "w-20 px-2 py-2" : "w-32"}`}>
      <SidebarItem compact={compact} Icon={LayoutTemplate} Onclick={() => onToolChange("Templates")} isActive={activeTool === "Templates"} Label="Templates" />
      <SidebarItem compact={compact} Icon={Image} Onclick={() => onToolChange("Images")} isActive={activeTool === "Images"} Label="Image" />
      <SidebarItem compact={compact} Icon={Type} Onclick={() => onToolChange("Text")} isActive={activeTool === "Text"} Label="Text" />
      <SidebarItem compact={compact} Icon={Shapes} Onclick={() => onToolChange("Shapes")} isActive={activeTool === "Shapes"} Label="Shapes" />
      <SidebarItem compact={compact} Icon={Ruler} Onclick={() => onToolChange("CanvasSize")} isActive={activeTool === "CanvasSize"} Label="Canvas" />
      <SidebarItem compact={compact} Icon={Sparkles} Onclick={() => onToolChange("AI")} isActive={activeTool === "AI"} Label="AI" />
      <SidebarItem compact={compact} Icon={Settings} Onclick={() => onToolChange("Settings")} isActive={activeTool === "Settings"} Label="Settings" />
    </div>
  )
}
