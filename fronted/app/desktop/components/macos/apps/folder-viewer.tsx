"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"

import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Plus,
  Grid3X3,
  List,
  Trash2,
} from "lucide-react"

import type { DesktopFolder, DesktopItemType } from "../desktop-icon"

const FILE_ICON_MAP: Record<DesktopItemType, { icon: typeof File; colorClass: string }> = {
  folder: { icon: Folder, colorClass: "text-[#56a3f8]" },
  text: { icon: FileText, colorClass: "text-[#5ac8fa]" },
  image: { icon: FileImage, colorClass: "text-[#ff9f0a]" },
  code: { icon: FileCode, colorClass: "text-[#bf5af2]" },
  spreadsheet: { icon: FileSpreadsheet, colorClass: "text-[#30d158]" },
  generic: { icon: File, colorClass: "text-[#8e8e93]" },
}

interface FolderViewerProps {
  folderId: string
  folderName: string
  allItems: DesktopFolder[]
  onOpenFolder: (folderId: string, folderName: string) => void
  onOpenFile: (fileId: string, fileName: string) => void
  onCreateItem: (parentId: string, itemType: DesktopItemType, name: string) => void
  onDeleteItem: (id: string) => void
  onRenameItem: (id: string, name: string) => void
  onMoveItemOut: (id: string) => void
  onMoveItemToFolder: (itemId: string, targetFolderId: string) => void
}

interface BreadcrumbItem {
  id: string
  name: string
}

type DesktopDragMoveDetail = {
  draggedId: string
  x: number
  y: number
}

type DesktopDragEndDetail = DesktopDragMoveDetail & {
  dropHandled: boolean
}

type FolderNativeDragStartDetail = {
  itemId: string
}

const DESKTOP_ITEM_MIME = "application/x-desktop-item-id"

export function FolderViewer({
  folderId,
  folderName,
  allItems,
  onOpenFolder: _onOpenFolder,
  onOpenFile,
  onCreateItem,
  onDeleteItem,
  onRenameItem,
  onMoveItemOut,
  onMoveItemToFolder,
}: FolderViewerProps) {
  const [currentFolderId, setCurrentFolderId] = useState(folderId)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | "desktop" | null>(null)
  const [isExternalDragOver, setIsExternalDragOver] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [history, setHistory] = useState<BreadcrumbItem[]>([{ id: folderId, name: folderName }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const editRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const itemById = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems])

  const children = allItems.filter((item) => item.parentId === currentFolderId)

  // Build breadcrumb path from root folder to current
  const breadcrumbs: BreadcrumbItem[] = []
  {
    let id: string | undefined | null = currentFolderId
    const visited = new Set<string>()
    while (id) {
      if (visited.has(id)) break
      visited.add(id)
      const item = allItems.find((i) => i.id === id)
      if (item) {
        breadcrumbs.unshift({ id: item.id, name: item.name })
        id = item.parentId
      } else {
        break
      }
    }
  }

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingId])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null)
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKey)
    }
  }, [contextMenu])

  const navigateTo = useCallback(
    (id: string, name: string) => {
      setCurrentFolderId(id)
      setSelectedItemId(null)
      setEditingId(null)
      setContextMenu(null)
      const newHistory = [...history.slice(0, historyIndex + 1), { id, name }]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex]
  )

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1]
      setCurrentFolderId(prev.id)
      setHistoryIndex(historyIndex - 1)
      setSelectedItemId(null)
      setEditingId(null)
    }
  }, [history, historyIndex])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1]
      setCurrentFolderId(next.id)
      setHistoryIndex(historyIndex + 1)
      setSelectedItemId(null)
      setEditingId(null)
    }
  }, [history, historyIndex])

  const commitRename = useCallback(() => {
    if (editingId) {
      const trimmed = editName.trim() || "Untitled"
      onRenameItem(editingId, trimmed)
      setEditingId(null)
    }
  }, [editingId, editName, onRenameItem])

  const handleDoubleClick = useCallback(
    (item: DesktopFolder) => {
      if (item.itemType === "folder") {
        navigateTo(item.id, item.name)
      } else if (item.itemType === "text") {
        onOpenFile(item.id, item.name)
      }
    },
    [navigateTo, onOpenFile]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleCreateItem = useCallback(
    (itemType: DesktopItemType, name: string) => {
      onCreateItem(currentFolderId, itemType, name)
      setContextMenu(null)
    },
    [currentFolderId, onCreateItem]
  )

  const isDescendantOf = useCallback(
    (possibleDescendantId: string, ancestorId: string) => {
      let currentParentId = itemById.get(possibleDescendantId)?.parentId ?? null
      while (currentParentId) {
        if (currentParentId === ancestorId) return true
        currentParentId = itemById.get(currentParentId)?.parentId ?? null
      }
      return false
    },
    [itemById]
  )

  const canMoveIntoFolder = useCallback(
    (itemId: string, targetFolderId: string) => {
      if (itemId === targetFolderId) return false
      const item = itemById.get(itemId)
      const target = itemById.get(targetFolderId)
      if (!item || !target || target.itemType !== "folder") return false
      if (item.parentId === targetFolderId) return false
      if (item.itemType === "folder" && isDescendantOf(targetFolderId, itemId)) return false
      return true
    },
    [itemById, isDescendantOf]
  )

  const getPointTargetInfo = useCallback((x: number, y: number) => {
    const element = document.elementFromPoint(x, y) as HTMLElement | null
    const dropzone = element?.closest<HTMLElement>("[data-folder-dropzone-id]")
    const folderItem = element?.closest<HTMLElement>("[data-folder-item-id]")
    return {
      dropzoneId: dropzone?.dataset.folderDropzoneId ?? null,
      overItem: Boolean(folderItem),
    }
  }, [])

  const handleDesktopDragMove = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<DesktopDragMoveDetail>).detail
      if (!detail) return
      const { dropzoneId, overItem } = getPointTargetInfo(detail.x, detail.y)
      const canDropHere =
        dropzoneId === currentFolderId &&
        !overItem &&
        canMoveIntoFolder(detail.draggedId, currentFolderId)
      setIsExternalDragOver(canDropHere)
    },
    [canMoveIntoFolder, currentFolderId, getPointTargetInfo]
  )

  const handleDesktopDragEnd = useCallback(
    (event: Event) => {
      setIsExternalDragOver(false)
      const detail = (event as CustomEvent<DesktopDragEndDetail>).detail
      if (!detail || detail.dropHandled) return

      const { dropzoneId, overItem } = getPointTargetInfo(detail.x, detail.y)
      if (
        dropzoneId === currentFolderId &&
        !overItem &&
        canMoveIntoFolder(detail.draggedId, currentFolderId)
      ) {
        detail.dropHandled = true
        onMoveItemToFolder(detail.draggedId, currentFolderId)
      }
    },
    [canMoveIntoFolder, currentFolderId, getPointTargetInfo, onMoveItemToFolder]
  )

  useEffect(() => {
    window.addEventListener("desktop-drag-move", handleDesktopDragMove)
    window.addEventListener("desktop-drag-end", handleDesktopDragEnd)
    return () => {
      window.removeEventListener("desktop-drag-move", handleDesktopDragMove)
      window.removeEventListener("desktop-drag-end", handleDesktopDragEnd)
    }
  }, [handleDesktopDragEnd, handleDesktopDragMove])

  const handleItemDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      if (editingId === itemId) {
        e.preventDefault()
        return
      }
      setDraggingItemId(itemId)
      setSelectedItemId(itemId)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData(DESKTOP_ITEM_MIME, itemId)
      e.dataTransfer.setData("text/plain", itemId)
      window.dispatchEvent(
        new CustomEvent("folder-native-drag-start", {
          detail: { itemId } as FolderNativeDragStartDetail,
        })
      )
    },
    [editingId]
  )

  const handleItemDragEnd = useCallback(() => {
    setDraggingItemId(null)
    setDragOverTarget(null)
    window.dispatchEvent(new CustomEvent("folder-native-drag-end"))
  }, [])

  const getDraggedItemId = useCallback(
    (e: React.DragEvent) => draggingItemId || e.dataTransfer.getData("text/plain") || null,
    [draggingItemId]
  )

  const handleDropToDesktop = useCallback(
    (e: React.DragEvent) => {
      const draggedId = getDraggedItemId(e)
      if (!draggedId) return
      e.preventDefault()
      setDragOverTarget(null)
      onMoveItemOut(draggedId)
    },
    [getDraggedItemId, onMoveItemOut]
  )

  const handleDropToFolder = useCallback(
    (e: React.DragEvent, targetFolderId: string) => {
      const draggedId = getDraggedItemId(e)
      if (!draggedId || !canMoveIntoFolder(draggedId, targetFolderId)) return
      e.preventDefault()
      setDragOverTarget(null)
      onMoveItemToFolder(draggedId, targetFolderId)
    },
    [canMoveIntoFolder, getDraggedItemId, onMoveItemToFolder]
  )

  const handleDragOverDropTarget = useCallback(
    (e: React.DragEvent, target: string | "desktop") => {
      const draggedId = getDraggedItemId(e)
      if (!draggedId) return

      const canDrop =
        target === "desktop"
          ? Boolean(itemById.get(draggedId)?.parentId)
          : canMoveIntoFolder(draggedId, target)
      if (!canDrop) return

      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverTarget(target)
    },
    [canMoveIntoFolder, getDraggedItemId, itemById]
  )

  const handleDragLeaveDropTarget = useCallback(() => {
    setDragOverTarget((prev) => (prev ? null : prev))
  }, [])

  const iconConfig = (type: DesktopItemType) => FILE_ICON_MAP[type] || FILE_ICON_MAP.generic
  const Icon = (type: DesktopItemType) => iconConfig(type).icon

  return (
    <div className="flex h-full flex-col" onContextMenu={handleContextMenu}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        {/* Back / Forward */}
        <button
          onClick={goBack}
          disabled={historyIndex <= 0}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-black/5 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4 text-[#555]" />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-black/5 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4 text-[#555]" />
        </button>

        {/* Breadcrumbs + drop targets */}
        <div className="flex flex-1 items-center gap-1 overflow-hidden text-[12px] text-[#666]">
          <button
            onDragOver={(e) => handleDragOverDropTarget(e, "desktop")}
            onDrop={handleDropToDesktop}
            onDragLeave={handleDragLeaveDropTarget}
            className={`truncate rounded px-1 py-0.5 transition-colors ${
              dragOverTarget === "desktop"
                ? "bg-[#0058d0]/15 text-[#0058d0]"
                : "text-[#666] hover:bg-black/5"
            }`}
          >
            Desktop
          </button>
          {breadcrumbs.length > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0 text-[#999]" />}
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0 text-[#999]" />}
              <button
                onClick={() => navigateTo(crumb.id, crumb.name)}
                onDragOver={(e) => handleDragOverDropTarget(e, crumb.id)}
                onDrop={(e) => handleDropToFolder(e, crumb.id)}
                onDragLeave={handleDragLeaveDropTarget}
                className={`truncate rounded px-1 py-0.5 transition-colors hover:bg-black/5 ${
                  dragOverTarget === crumb.id
                    ? "bg-[#0058d0]/15 text-[#0058d0]"
                    : crumb.id === currentFolderId
                      ? "font-medium text-[#333]"
                      : "text-[#666]"
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* View toggle */}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-black/5"
        >
          {viewMode === "grid" ? (
            <List className="h-4 w-4 text-[#555]" />
          ) : (
            <Grid3X3 className="h-4 w-4 text-[#555]" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        data-folder-dropzone-id={currentFolderId}
        className="flex-1 overflow-auto p-3"
        style={{
          boxShadow: isExternalDragOver ? "inset 0 0 0 2px rgba(0,88,208,0.35)" : undefined,
          background: isExternalDragOver ? "rgba(0,88,208,0.06)" : undefined,
        }}
        onClick={() => {
          setSelectedItemId(null)
          setEditingId(null)
        }}
      >
        {children.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[#999]">
            This folder is empty
          </div>
        ) : viewMode === "grid" ? (
          /* Icon Grid View */
          <div className="flex flex-wrap gap-2 content-start">
            {children.map((item) => {
              const type = item.itemType || "generic"
              const IconComp = Icon(type)
              const config = iconConfig(type)
              return (
                <div
                  key={item.id}
                  data-folder-item-id={item.id}
                  draggable={editingId !== item.id}
                  className={`flex w-[90px] flex-col items-center gap-1 rounded-lg p-2 cursor-default transition-colors ${
                    selectedItemId === item.id
                      ? "bg-[#0058d0]/10"
                      : "hover:bg-black/[0.04]"
                  } ${draggingItemId === item.id ? "opacity-60" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItemId(item.id)
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (editingId !== item.id) handleDoubleClick(item)
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation()
                    setSelectedItemId(item.id)
                    setContextMenu({ x: e.clientX, y: e.clientY })
                  }}
                  onDragStart={(e) => handleItemDragStart(e, item.id)}
                  onDragEnd={handleItemDragEnd}
                >
                  <div className="flex h-[52px] w-[52px] items-center justify-center">
                    <IconComp
                      className={`h-10 w-10 ${config.colorClass} ${
                        type === "folder" ? "fill-[#56a3f8]" : ""
                      } drop-shadow-sm`}
                    />
                  </div>
                  {editingId === item.id ? (
                    <input
                      ref={editRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === "Enter") commitRename()
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-[80px] rounded-[3px] border border-[#4a9df8] bg-white px-1 text-center text-[11px] leading-tight text-[#1a1a1a] outline-none"
                    />
                  ) : (
                    <span
                      className={`max-w-[80px] truncate rounded-[3px] px-1 py-0.5 text-center text-[11px] font-medium leading-tight ${
                        selectedItemId === item.id
                          ? "bg-[#0058d0] text-white"
                          : "text-[#333]"
                      }`}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="text-left text-[11px] font-medium text-[#888]"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
              >
                <th className="pb-1 pl-4">Name</th>
                <th className="pb-1">Type</th>
              </tr>
            </thead>
            <tbody>
              {children.map((item) => {
                const type = item.itemType || "generic"
                const IconComp = Icon(type)
                const config = iconConfig(type)
                return (
                  <tr
                    key={item.id}
                    data-folder-item-id={item.id}
                    draggable={editingId !== item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemId(item.id)
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      handleDoubleClick(item)
                    }}
                    className={`cursor-default transition-colors ${
                      selectedItemId === item.id
                        ? "bg-[#0058d0] text-white"
                        : "hover:bg-black/[0.04] text-[#333]"
                    } ${draggingItemId === item.id ? "opacity-60" : ""}`}
                    onDragStart={(e) => handleItemDragStart(e, item.id)}
                    onDragEnd={handleItemDragEnd}
                  >
                    <td className="flex items-center gap-2 py-1.5 pl-4">
                      <IconComp
                        className={`h-4 w-4 ${
                          selectedItemId === item.id ? "text-white" : config.colorClass
                        } ${type === "folder" && selectedItemId !== item.id ? "fill-[#56a3f8]" : ""}`}
                      />
                      {editingId === item.id ? (
                        <input
                          ref={editRef}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            e.stopPropagation()
                            if (e.key === "Enter") commitRename()
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-40 rounded-[3px] border border-[#4a9df8] bg-white px-1 text-[12px] text-[#1a1a1a] outline-none"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="py-1.5 capitalize">{type}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-[11px] text-[#888]"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <span>{children.length} items</span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[10003] min-w-[200px] animate-ctx-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div
            className="rounded-lg border border-black/10 py-1 shadow-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(60px) saturate(180%)",
            }}
          >
            {/* New items */}
            <button
              onClick={() => handleCreateItem("folder", "untitled folder")}
              className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
            >
              <Folder className="h-3.5 w-3.5 opacity-60" />
              New Folder
            </button>
            <div className="mx-2 my-1 h-px bg-black/8" />
            <button
              onClick={() => handleCreateItem("text", "untitled.txt")}
              className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
            >
              <FileText className="h-3.5 w-3.5 opacity-60" />
              New Text File
            </button>
            <button
              onClick={() => handleCreateItem("code", "untitled.js")}
              className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
            >
              <FileCode className="h-3.5 w-3.5 opacity-60" />
              New Code File
            </button>
            <button
              onClick={() => handleCreateItem("generic", "untitled")}
              className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 opacity-60" />
              New File
            </button>

            {/* Actions on selected item */}
            {selectedItemId && (
              <>
                <div className="mx-2 my-1 h-px bg-black/8" />
                <button
                  onClick={() => {
                    const item = allItems.find((i) => i.id === selectedItemId)
                    if (item) {
                      setEditName(item.name)
                      setEditingId(selectedItemId)
                    }
                    setContextMenu(null)
                  }}
                  className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
                >
                  <File className="h-3.5 w-3.5 opacity-60" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onMoveItemOut(selectedItemId)
                    setSelectedItemId(null)
                    setContextMenu(null)
                  }}
                  className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-[#262626] transition-colors hover:bg-[#0058d0] hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5 opacity-60" />
                  Move to Desktop
                </button>
                <button
                  onClick={() => {
                    onDeleteItem(selectedItemId)
                    setSelectedItemId(null)
                    setContextMenu(null)
                  }}
                  className="flex w-full items-center gap-2 rounded-[4px] px-3 py-1 text-left text-[13px] text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5 opacity-60" />
                  Move to Trash
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
