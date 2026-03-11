"use client"

import { useState, useEffect, useRef } from "react"

import {
  FolderPlus,
  FilePlus,
  FileText,
  FileImage,
  FileCode,
  FileSpreadsheet,
  File,
  Info,
  LayoutGrid,
  Layers,
  ArrowUpDown,
  Sparkles,
  Eye,
  FolderOpen,
  ChevronRight,
} from "lucide-react"

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
}

type MenuItem =
  | { label: string; action: string; icon: typeof File; hasSubmenu?: boolean; submenu?: SubMenuItem[] }
  | { type: "separator" }

type SubMenuItem = { label: string; action: string; icon: typeof File }

const MENU_ITEMS: MenuItem[] = [
  { label: "New Folder", action: "new-folder", icon: FolderPlus },
  {
    label: "New File",
    action: "new-file",
    icon: FilePlus,
    hasSubmenu: true,
    submenu: [
      { label: "Text Document", action: "new-file-text", icon: FileText },
      { label: "Image File", action: "new-file-image", icon: FileImage },
      { label: "Code File", action: "new-file-code", icon: FileCode },
      { label: "Spreadsheet", action: "new-file-spreadsheet", icon: FileSpreadsheet },
      { label: "Empty File", action: "new-file-generic", icon: File },
    ],
  },
  { label: "Get Info", action: "info", icon: Info },
  { type: "separator" },
  { label: "Edit Widgets...", action: "widgets", icon: LayoutGrid },
  { type: "separator" },
  { label: "Use Stacks", action: "stacks", icon: Layers },
  { label: "Sort By", action: "sort", hasSubmenu: true, icon: ArrowUpDown },
  { label: "Clean Up", action: "cleanup", icon: Sparkles },
  { type: "separator" },
  { label: "Show View Options", action: "view-options", icon: Eye },
  { label: "Open in Finder", action: "finder", icon: FolderOpen },
]

export function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 400)

  return (
    <div
      ref={menuRef}
      className="fixed z-[10001] min-w-[220px]"
      style={{
        top: adjustedY,
        left: adjustedX,
        animation: "ctx-menu 0.12s ease-out both",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-[10px] py-1"
        style={{
          background: "rgba(236, 236, 236, 0.88)",
          backdropFilter: "blur(50px) saturate(180%)",
          WebkitBackdropFilter: "blur(50px) saturate(180%)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.12)",
        }}
      >
        {MENU_ITEMS.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return (
              <div
                key={`sep-${i}`}
                className="mx-2 my-1 h-px"
                style={{ background: "rgba(0,0,0,0.1)" }}
              />
            )
          }
          if (!("label" in item)) return null
          const Icon = item.icon
          const hasSubmenu = item.hasSubmenu && item.submenu
          return (
            <div
              key={item.action}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.action)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => {
                  if (!hasSubmenu) onAction(item.action)
                }}
                className="flex w-full items-center justify-between rounded-[5px] mx-1 px-2.5 py-[5px] text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
                style={{ width: "calc(100% - 8px)" }}
              >
                <span className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-4 w-4 opacity-55" />}
                  {item.label}
                </span>
                {item.hasSubmenu && (
                  <ChevronRight className="h-3 w-3 opacity-40" />
                )}
              </button>

              {/* Submenu */}
              {hasSubmenu && hoveredItem === item.action && (
                <div
                  className="absolute left-full top-0 z-[10003] ml-0.5 min-w-[190px]"
                  style={{
                    animation: "ctx-menu 0.1s ease-out both",
                  }}
                >
                  <div
                    className="rounded-[10px] py-1"
                    style={{
                      background: "rgba(236, 236, 236, 0.92)",
                      backdropFilter: "blur(50px) saturate(180%)",
                      WebkitBackdropFilter: "blur(50px) saturate(180%)",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.12)",
                    }}
                  >
                    {item.submenu!.map((sub) => {
                      const SubIcon = sub.icon
                      return (
                        <button
                          key={sub.action}
                          onClick={() => onAction(sub.action)}
                          className="flex w-full items-center gap-2.5 rounded-[5px] mx-1 px-2.5 py-[5px] text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
                          style={{ width: "calc(100% - 8px)" }}
                        >
                          <SubIcon className="h-4 w-4 opacity-55" />
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
