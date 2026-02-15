"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Folder } from "lucide-react"

export interface DesktopFolder {
  id: string
  name: string
  x: number
  y: number
  isNew?: boolean
}

interface DesktopIconProps {
  folder: DesktopFolder
  selected: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onRename: (id: string, name: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export function DesktopIcon({
  folder,
  selected,
  onSelect,
  onDoubleClick,
  onRename,
  onMove,
}: DesktopIconProps) {
  const [editing, setEditing] = useState(folder.isNew ?? false)
  const [name, setName] = useState(folder.name)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

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
    if (editing) return
    e.stopPropagation()
    onSelect()

    dragOffset.current = {
      x: e.clientX - folder.x,
      y: e.clientY - folder.y,
    }

    const handleMouseMove = (ev: MouseEvent) => {
      setDragging(true)
      onMove(folder.id, ev.clientX - dragOffset.current.x, ev.clientY - dragOffset.current.y)
    }

    const handleMouseUp = () => {
      setDragging(false)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className="absolute flex w-[90px] flex-col items-center gap-1 cursor-default"
      style={{
        left: folder.x,
        top: folder.y,
        zIndex: dragging ? 9999 : 1,
        opacity: dragging ? 0.8 : 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        if (!editing) {
          e.stopPropagation()
          onDoubleClick()
        }
      }}
    >
      {/* Folder icon */}
      <div
        className={`flex h-[60px] w-[60px] items-center justify-center rounded-lg transition-colors ${
          selected ? "bg-white/25" : "hover:bg-white/10"
        }`}
      >
        <Folder className="h-12 w-12 fill-[#56a3f8] text-[#2d87f3] drop-shadow-sm" />
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
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
        >
          {folder.name}
        </span>
      )}
    </div>
  )
}
