"use client"

import { useEffect, useRef } from "react"

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
}

const MENU_ITEMS = [
  { label: "New Folder", action: "new-folder" },
  { label: "Get Info", action: "info" },
  { type: "separator" as const },
  { label: "Change Wallpaper...", action: "settings" },
  { label: "Edit Widgets...", action: "widgets" },
  { type: "separator" as const },
  { label: "Use Stacks", action: "stacks" },
  { label: "Sort By", action: "sort", hasSubmenu: true },
  { label: "Clean Up", action: "cleanup" },
  { type: "separator" as const },
  { label: "Show View Options", action: "view-options" },
  { label: "Open Terminal Here", action: "terminal" },
  { label: "Open in Finder", action: "finder" },
]

export function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

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
  const adjustedY = Math.min(y, window.innerHeight - 320)

  return (
    <div
      ref={menuRef}
      className="fixed z-[10001] min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: adjustedY,
        left: adjustedX,
        background: "rgba(236, 236, 236, 0.88)",
        backdropFilter: "blur(50px) saturate(180%)",
        WebkitBackdropFilter: "blur(50px) saturate(180%)",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.12)",
        padding: "4px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {MENU_ITEMS.map((item, i) => {
        if (item.type === "separator") {
          return (
            <div
              key={`sep-${i}`}
              className="my-1 h-px"
              style={{ background: "rgba(0,0,0,0.1)" }}
            />
          )
        }
        return (
          <button
            key={item.action}
            onClick={() => onAction(item.action!)}
            className="flex w-full items-center justify-between rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
          >
            <span>{item.label}</span>
            {item.hasSubmenu && (
              <svg className="h-3 w-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,6 15,12 9,18" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
