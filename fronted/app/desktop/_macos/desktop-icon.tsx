"use client"

import { useState, useRef, useEffect, useCallback } from "react"

import { Folder, Pencil, Trash2, FolderOpen, Info, FileText, File, FileImage, FileCode, FileSpreadsheet } from "lucide-react"

import type { DesktopFolder, DesktopItemType } from "@/lib/desktop/types"
import { useTrackAction } from "@/lib/hooks/use-track-action"

interface DesktopIconProps {
  folder: DesktopFolder
  selected: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onMoveEnd: (id: string, x: number, y: number) => void
  onMoveIntoFolder?: (itemId: string, targetFolderId: string) => void
  allDesktopItems?: DesktopFolder[]
}

type DesktopDragMoveDetail = {
  draggedId: string
  x: number
  y: number
}

type DesktopDragEndDetail = {
  draggedId: string
  x: number
  y: number
  dropHandled: boolean
}

const FILE_ICON_MAP: Record<DesktopItemType, { icon: typeof File; fillClass: string; textClass: string }> = {
  folder: { icon: Folder, fillClass: "fill-[#56a3f8]", textClass: "text-[#2d87f3]" },
  text: { icon: FileText, fillClass: "", textClass: "text-[#5ac8fa]" },
  image: { icon: FileImage, fillClass: "", textClass: "text-[#ff9f0a]" },
  code: { icon: FileCode, fillClass: "", textClass: "text-[#bf5af2]" },
  spreadsheet: { icon: FileSpreadsheet, fillClass: "", textClass: "text-[#30d158]" },
  generic: { icon: File, fillClass: "", textClass: "text-[#8e8e93]" },
}

export function DesktopIcon({
  folder,
  selected,
  onSelect,
  onDoubleClick,
  onRename,
  onDelete,
  onMove,
  onMoveEnd,
  onMoveIntoFolder,
  allDesktopItems,
}: DesktopIconProps) {
  const track = useTrackAction()
  const [editing, setEditing] = useState(folder.isNew ?? false)
  const [name, setName] = useState(folder.name)
  const [dragging, setDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [folderMenu, setFolderMenu] = useState<{ x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const itemType = folder.itemType || "folder"
  const isFolder = itemType === "folder"

  useEffect(() => {
    queueMicrotask(() => setName(folder.name))
  }, [folder.name])

  useEffect(() => {
    if (folder.isNew && !editing) {
      queueMicrotask(() => setEditing(true))
    }
  }, [editing, folder.isNew])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Close folder context menu on outside click
  useEffect(() => {
    if (!folderMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFolderMenu(null)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFolderMenu(null)
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKey)
    }
  }, [folderMenu])

  const commitRename = useCallback(() => {
    const trimmed = name.trim() || "Untitled Folder"
    setName(trimmed)
    setEditing(false)
    onRename(folder.id, trimmed)
  }, [name, folder.id, onRename])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      commitRename()
    }
    if (e.key === "Escape") {
      setName(folder.name)
      setEditing(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing || e.button === 2) return
    e.stopPropagation()
    onSelect()

    dragOffset.current = {
      x: e.clientX - folder.x,
      y: e.clientY - folder.y,
    }

    let didDrag = false

    const handleMouseMove = (ev: MouseEvent) => {
      didDrag = true
      setDragging(true)
      onMove(folder.id, ev.clientX - dragOffset.current.x, ev.clientY - dragOffset.current.y)

      // Dispatch custom event so other icons can detect hover
      window.dispatchEvent(
        new CustomEvent("desktop-drag-move", {
          detail: { draggedId: folder.id, x: ev.clientX, y: ev.clientY } as DesktopDragMoveDetail,
        })
      )
    }

    const handleMouseUp = (ev: MouseEvent) => {
      setDragging(false)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      const finalX = ev.clientX - dragOffset.current.x
      const finalY = ev.clientY - dragOffset.current.y
      if (!didDrag) {
        window.dispatchEvent(new CustomEvent("desktop-drag-end"))
        return
      }

      // Allow folder viewer windows to consume this drop first.
      const dragEndDetail: DesktopDragEndDetail = {
        draggedId: folder.id,
        x: ev.clientX,
        y: ev.clientY,
        dropHandled: false,
      }
      window.dispatchEvent(new CustomEvent("desktop-drag-end", { detail: dragEndDetail }))

      // Check if dropped on a desktop folder icon when no window consumed the drop.
      if (!dragEndDetail.dropHandled && onMoveIntoFolder && allDesktopItems) {
        const targetFolder = allDesktopItems.find((item) => {
          if (item.id === folder.id || item.itemType !== "folder") return false
          const rect = {
            left: item.x,
            top: item.y,
            right: item.x + 90,
            bottom: item.y + 90,
          }
          return ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom
        })
        if (targetFolder) {
          dragEndDetail.dropHandled = true
          onMoveIntoFolder(folder.id, targetFolder.id)
        }
      }

      if (!dragEndDetail.dropHandled) {
        // Ensure UI and backend settle on the exact drop point only when item stays on desktop.
        onMove(folder.id, finalX, finalY)
        onMoveEnd(folder.id, finalX, finalY)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Listen for drag events from other icons to show drop target highlight
  useEffect(() => {
    if (!isFolder) return

    const handleDragMove = (e: Event) => {
      const detail = (e as CustomEvent<DesktopDragMoveDetail>).detail
      if (!detail) return
      if (detail.draggedId === folder.id) return
      const rect = {
        left: folder.x,
        top: folder.y,
        right: folder.x + 90,
        bottom: folder.y + 90,
      }
      const isOver =
        detail.x >= rect.left &&
        detail.x <= rect.right &&
        detail.y >= rect.top &&
        detail.y <= rect.bottom
      setIsDropTarget(isOver)
    }

    const handleDragEnd = () => {
      setIsDropTarget(false)
    }

    window.addEventListener("desktop-drag-move", handleDragMove)
    window.addEventListener("desktop-drag-end", handleDragEnd)
    return () => {
      window.removeEventListener("desktop-drag-move", handleDragMove)
      window.removeEventListener("desktop-drag-end", handleDragEnd)
    }
  }, [isFolder, folder.id, folder.x, folder.y])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    setFolderMenu({ x: e.clientX, y: e.clientY })
  }

  const FOLDER_MENU_ITEMS = [
    { label: "Open", icon: isFolder ? FolderOpen : FileText, action: "open" as const },
    { label: "Get Info", icon: Info, action: "info" as const },
    { type: "separator" as const },
    { label: "Rename", icon: Pencil, action: "rename" as const },
    { label: "Duplicate", icon: File, action: "duplicate" as const },
    { type: "separator" as const },
    { label: "Move to Trash", icon: Trash2, action: "delete" as const, danger: true },
  ]

  const iconConfig = FILE_ICON_MAP[itemType]
  const IconComponent = iconConfig.icon

  return (
    <>
      <div
        className="absolute flex w-[90px] flex-col items-center gap-1 cursor-default"
        style={{
          left: folder.x,
          top: folder.y,
          zIndex: dragging ? 9999 : 1,
          opacity: dragging ? 0.8 : 1,
          transition: dragging ? "none" : "opacity 0.15s ease",
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onDoubleClick={(e) => {
          if (!editing) {
            e.stopPropagation()
            onDoubleClick()
          }
        }}
      >
        {/* Icon */}
        <div
          className={`flex h-[60px] w-[60px] items-center justify-center rounded-lg transition-colors ${
            isDropTarget
              ? "bg-[#0058d0]/30 ring-2 ring-[#0058d0]/50"
              : selected
                ? "bg-white/25"
                : "hover:bg-white/10"
          }`}
        >
          <IconComponent className={`h-12 w-12 ${iconConfig.fillClass} ${iconConfig.textClass} drop-shadow-sm`} />
        </div>

        {/* Name label */}
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="w-[90px] rounded-[3px] border border-[#4a9df8] bg-white px-1 text-center text-[11px] leading-tight text-[#1a1a1a] outline-none"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`max-w-[90px] truncate rounded-[3px] px-1.5 py-0.5 text-center text-[11px] font-medium leading-tight ${
              selected
                ? "bg-[#0058d0] text-white"
                : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            }`}
          >
            {folder.name}
          </span>
        )}
      </div>

      {/* Folder-specific right-click context menu */}
      {folderMenu && (
        <div
          ref={menuRef}
          className="fixed z-[10002] min-w-[200px] animate-ctx-menu"
          style={{ left: folderMenu.x, top: folderMenu.y }}
        >
          <div
            className="rounded-lg border border-black/10 py-1 shadow-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(60px) saturate(180%)",
            }}
          >
            {FOLDER_MENU_ITEMS.map((item, i) => {
              if ("type" in item && item.type === "separator") {
                return <div key={`sep-${i}`} className="mx-2 my-1 h-px bg-black/8" />
              }
              const Icon = item.icon
              return (
                <button
                  key={item.action}
                  onClick={(e) => {
                    e.stopPropagation()
                    track({ type: "desktop_icon_context_menu", itemId: folder.id, action: item.action })
                    setFolderMenu(null)
                    if (item.action === "open") onDoubleClick()
                    if (item.action === "rename") setEditing(true)
                    if (item.action === "delete") onDelete(folder.id)
                    if (item.action === "duplicate") {
                      /* duplicate is a no-op for now, just closes the menu */
                    }
                  }}
                  className={`flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] transition-colors ${
                    item.danger
                      ? "text-red-500 hover:bg-red-500 hover:text-white"
                      : "text-[#262626] hover:bg-[#0058d0] hover:text-white"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 opacity-60" />}
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
