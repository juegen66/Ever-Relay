"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import type { WindowState } from "./types"
import { FinderApp } from "./apps/finder-app"
import { CanvasApp } from "./apps/canvas-app"
import { VibecodingApp } from "./apps/vibecoding-app"
import { FolderViewer } from "./apps/folder-viewer"
import { TextEditApp } from "./apps/textedit-app"
import type { DesktopFolder, DesktopItemType } from "./desktop-icon"

const APP_TITLES: Record<string, string> = {
  finder: "Finder",
  canvas: "Canvas",
  vibecoding: "vibecoding",
  textedit: "TextEdit",
}

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  finder: FinderApp,
  canvas: CanvasApp,
  vibecoding: VibecodingApp,
}

// Dark title bar apps
const DARK_TITLEBAR_APPS = new Set<string>()

interface AppWindowProps {
  windowState: WindowState
  isActive: boolean
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onMove: (x: number, y: number) => void
  onResize: (w: number, h: number) => void
  // Folder viewer props
  folderViewerProps?: {
    allItems: DesktopFolder[]
    onOpenFolder: (folderId: string, folderName: string) => void
    onOpenFile: (fileId: string, fileName: string) => void
    onCreateItem: (parentId: string, itemType: DesktopItemType, name: string) => void
    onDeleteItem: (id: string) => void
    onRenameItem: (id: string, name: string) => void
    onMoveItemOut: (id: string) => void
    onMoveItemToFolder: (itemId: string, targetFolderId: string) => void
  }
}

export function AppWindow({
  windowState,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  folderViewerProps,
}: AppWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef<string | false>(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const maximizeAnimationTimerRef = useRef<number | null>(null)
  const [isTogglingMaximize, setIsTogglingMaximize] = useState(false)
  const { x, y, width, height, zIndex, maximized, appId } = windowState
  const isDark = DARK_TITLEBAR_APPS.has(appId)
  const isCanvasApp = appId === "canvas"

  const handleMouseDownTitle = useCallback(
    (e: React.MouseEvent) => {
      if (maximized) return
      e.preventDefault()
      onFocus()
      isDragging.current = true
      dragStart.current = { x: e.clientX - x, y: e.clientY - y }
    },
    [x, y, onFocus, maximized]
  )

  const handleMouseDownResize = useCallback(
    (direction: string) => (e: React.MouseEvent) => {
      if (maximized) return
      e.preventDefault()
      e.stopPropagation()
      onFocus()
      isResizing.current = direction
      dragStart.current = { x: e.clientX, y: e.clientY }
    },
    [onFocus, maximized]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = Math.max(-width + 100, e.clientX - dragStart.current.x)
        const newY = Math.max(0, e.clientY - dragStart.current.y)
        onMove(newX, newY)
      }
      if (isResizing.current) {
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        dragStart.current = { x: e.clientX, y: e.clientY }

        const dir = isResizing.current
        let newWidth = width
        let newHeight = height
        let newX = x
        let newY = y

        if (dir.includes("e")) newWidth = Math.max(300, width + dx)
        if (dir.includes("w")) {
          newWidth = Math.max(300, width - dx)
          if (newWidth > 300) newX = x + dx
        }
        if (dir.includes("s")) newHeight = Math.max(200, height + dy)
        if (dir.includes("n")) {
          newHeight = Math.max(200, height - dy)
          if (newHeight > 200) newY = y + dy
        }

        onResize(newWidth, newHeight)
        if (dir.includes("w") || dir.includes("n")) {
          onMove(newX, newY)
        }
      }
    }
    const handleMouseUp = () => {
      isDragging.current = false
      isResizing.current = false
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [width, height, x, y, onMove, onResize])

  useEffect(() => {
    return () => {
      if (maximizeAnimationTimerRef.current !== null) {
        window.clearTimeout(maximizeAnimationTimerRef.current)
      }
    }
  }, [])

  const handleToggleMaximize = useCallback(() => {
    setIsTogglingMaximize(true)
    if (maximizeAnimationTimerRef.current !== null) {
      window.clearTimeout(maximizeAnimationTimerRef.current)
    }
    onMaximize()
    maximizeAnimationTimerRef.current = window.setTimeout(() => {
      setIsTogglingMaximize(false)
      maximizeAnimationTimerRef.current = null
    }, 320)
  }, [onMaximize])

  const isFolderViewer = appId === "finder" && windowState.folderId
  const isFileViewer = appId === "textedit" && windowState.fileId
  const AppContent = (isFolderViewer || isFileViewer) ? null : APP_COMPONENTS[appId]
  const shouldAnimateWindowBounds = maximized || isTogglingMaximize

  const windowStyle = maximized
    ? {
        top: 0,
        left: 0,
        width: "100%" as const,
        height: "100%" as const,
        zIndex,
      }
    : { top: y, left: x, width, height, zIndex }

  const titleBarBg = isCanvasApp
    ? isActive
      ? "rgba(248, 249, 251, 0.86)"
      : "rgba(245, 246, 248, 0.82)"
    : isDark
      ? isActive
        ? "rgba(40, 40, 40, 0.95)"
        : "rgba(50, 50, 50, 0.9)"
      : isActive
        ? "rgba(232, 232, 232, 0.85)"
        : "rgba(240, 240, 240, 0.85)"

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col overflow-hidden animate-window-open"
      style={{
        ...windowStyle,
        borderRadius: maximized ? 0 : "10px",
        background: isCanvasApp
          ? isActive
            ? "rgba(244, 246, 249, 0.9)"
            : "rgba(244, 246, 249, 0.84)"
          : isDark
            ? isActive
              ? "rgba(30, 30, 30, 0.96)"
              : "rgba(40, 40, 40, 0.92)"
            : isActive
              ? "rgba(246, 246, 246, 0.94)"
              : "rgba(246, 246, 246, 0.88)",
        backdropFilter: "blur(50px) saturate(180%)",
        WebkitBackdropFilter: "blur(50px) saturate(180%)",
        border: isCanvasApp
          ? isActive
            ? "0.5px solid rgba(0,0,0,0.16)"
            : "0.5px solid rgba(0,0,0,0.1)"
          : isActive
            ? "0.5px solid rgba(0,0,0,0.22)"
            : "0.5px solid rgba(0,0,0,0.12)",
        boxShadow: isActive
          ? isCanvasApp
            ? "0 22px 70px 4px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(0,0,0,0.08)"
            : "0 22px 70px 4px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.12)"
          : isCanvasApp
            ? "0 5px 20px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.05)"
            : "0 5px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        transition: shouldAnimateWindowBounds
          ? "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, box-shadow 0.2s ease"
          : "box-shadow 0.2s ease",
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onFocus()
      }}
    >
      {/* Title Bar */}
      <div
        className="flex h-[38px] flex-shrink-0 cursor-default items-center px-3.5"
        style={{
          background: titleBarBg,
          borderBottom: isCanvasApp
            ? "1px solid rgba(0,0,0,0.08)"
            : isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.08)",
        }}
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={handleToggleMaximize}
      >
        {/* Traffic Lights */}
        <div className="mr-3 flex items-center gap-[7px]">
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: "#ff5f57" }}
            aria-label="Close window"
          >
            <svg className="opacity-0 transition-opacity group-hover:opacity-100" width="6" height="6" viewBox="0 0 6 6" fill="none">
              <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(80,0,0,0.6)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: "#febc2e" }}
            aria-label="Minimize window"
          >
            <svg className="opacity-0 transition-opacity group-hover:opacity-100" width="7" height="1" viewBox="0 0 7 1" fill="none">
              <path d="M0.5 0.5H6.5" stroke="rgba(80,50,0,0.6)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleMaximize() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: "#28c840" }}
            aria-label="Maximize window"
          >
            <svg className="opacity-0 transition-opacity group-hover:opacity-100" width="7" height="7" viewBox="0 0 8 8" fill="none">
              <path d="M1 4V1.5C1 1.22 1.22 1 1.5 1H4M7 4V6.5C7 6.78 6.78 7 6.5 7H4M4 1L1 4M4 7L7 4"
                stroke="rgba(0,60,0,0.6)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={`flex-1 text-center text-[13px] font-medium ${isDark ? "text-white/60" : "text-[#4a4a4a]"}`}>
          {isFolderViewer ? windowState.folderName || "Folder" : isFileViewer ? windowState.fileName || "Untitled" : APP_TITLES[appId]}
        </div>
        <div className="w-[62px]" />
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        {isFolderViewer && folderViewerProps ? (
          <FolderViewer
            folderId={windowState.folderId!}
            folderName={windowState.folderName || "Folder"}
            allItems={folderViewerProps.allItems}
            onOpenFolder={folderViewerProps.onOpenFolder}
            onOpenFile={folderViewerProps.onOpenFile}
            onCreateItem={folderViewerProps.onCreateItem}
            onDeleteItem={folderViewerProps.onDeleteItem}
            onRenameItem={folderViewerProps.onRenameItem}
            onMoveItemOut={folderViewerProps.onMoveItemOut}
            onMoveItemToFolder={folderViewerProps.onMoveItemToFolder}
          />
        ) : isFileViewer ? (
          <TextEditApp
            fileId={windowState.fileId!}
            fileName={windowState.fileName || "Untitled"}
          />
        ) : AppContent ? (
          <AppContent />
        ) : null}
      </div>

      {/* Resize Handles - all edges and corners */}
      {!maximized && (
        <>
          <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" onMouseDown={handleMouseDownResize("n")} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" onMouseDown={handleMouseDownResize("s")} />
          <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" onMouseDown={handleMouseDownResize("w")} />
          <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" onMouseDown={handleMouseDownResize("e")} />
          <div className="absolute top-0 left-0 h-2 w-2 cursor-nw-resize" onMouseDown={handleMouseDownResize("nw")} />
          <div className="absolute top-0 right-0 h-2 w-2 cursor-ne-resize" onMouseDown={handleMouseDownResize("ne")} />
          <div className="absolute bottom-0 left-0 h-2 w-2 cursor-sw-resize" onMouseDown={handleMouseDownResize("sw")} />
          <div className="absolute bottom-0 right-0 h-2 w-2 cursor-se-resize" onMouseDown={handleMouseDownResize("se")} />
        </>
      )}
    </div>
  )
}
