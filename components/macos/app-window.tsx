"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import type { WindowState } from "./types"
import { FinderApp } from "./apps/finder-app"
import { CalculatorApp } from "./apps/calculator-app"
import { NotesApp } from "./apps/notes-app"
import { TerminalApp } from "./apps/terminal-app"
import { SafariApp } from "./apps/safari-app"
import { SettingsApp } from "./apps/settings-app"
import { PhotosApp } from "./apps/photos-app"

const APP_TITLES: Record<string, string> = {
  finder: "Finder",
  calculator: "Calculator",
  notes: "Notes",
  terminal: "Terminal",
  safari: "Safari",
  settings: "System Settings",
  photos: "Photos",
}

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  finder: FinderApp,
  calculator: CalculatorApp,
  notes: NotesApp,
  terminal: TerminalApp,
  safari: SafariApp,
  settings: SettingsApp,
  photos: PhotosApp,
}

interface AppWindowProps {
  windowState: WindowState
  isActive: boolean
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onMove: (x: number, y: number) => void
  onResize: (w: number, h: number) => void
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
}: AppWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const [showBtns, setShowBtns] = useState(false)

  const { x, y, width, height, zIndex, maximized, appId } = windowState

  const handleMouseDownTitle = useCallback(
    (e: React.MouseEvent) => {
      if (maximized) return
      e.preventDefault()
      onFocus()
      isDragging.current = true
      dragStart.current = {
        x: e.clientX - x,
        y: e.clientY - y,
      }
    },
    [x, y, onFocus, maximized]
  )

  const handleMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      if (maximized) return
      e.preventDefault()
      e.stopPropagation()
      onFocus()
      isResizing.current = true
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
      }
    },
    [onFocus, maximized]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = Math.max(0, e.clientX - dragStart.current.x)
        const newY = Math.max(28, e.clientY - dragStart.current.y)
        onMove(newX, newY)
      }
      if (isResizing.current) {
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        const newWidth = Math.max(300, width + dx)
        const newHeight = Math.max(200, height + dy)
        onResize(newWidth, newHeight)
        dragStart.current = { x: e.clientX, y: e.clientY }
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
  }, [width, height, onMove, onResize])

  const AppContent = APP_COMPONENTS[appId]

  const windowStyle = maximized
    ? { top: 28, left: 0, width: "100vw", height: "calc(100vh - 28px)", zIndex }
    : { top: y, left: x, width, height, zIndex }

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col overflow-hidden rounded-xl shadow-2xl"
      style={{
        ...windowStyle,
        background: isActive
          ? "rgba(245, 245, 245, 0.92)"
          : "rgba(245, 245, 245, 0.85)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: isActive
          ? "0.5px solid rgba(0,0,0,0.2)"
          : "0.5px solid rgba(0,0,0,0.12)",
        boxShadow: isActive
          ? "0 22px 70px 4px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.12)"
          : "0 8px 30px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.08)",
        transition: maximized ? "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
      }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className="flex h-12 flex-shrink-0 cursor-default items-center gap-2 px-4"
        style={{
          background: isActive
            ? "rgba(232, 232, 232, 0.8)"
            : "rgba(240, 240, 240, 0.8)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={onMaximize}
      >
        {/* Traffic Lights */}
        <div
          className="flex items-center gap-2"
          onMouseEnter={() => setShowBtns(true)}
          onMouseLeave={() => setShowBtns(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex h-3 w-3 items-center justify-center rounded-full transition-colors"
            style={{
              background: isActive ? "#ff5f57" : "#ddd",
            }}
            aria-label="Close window"
          >
            {showBtns && (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMinimize()
            }}
            className="flex h-3 w-3 items-center justify-center rounded-full transition-colors"
            style={{
              background: isActive ? "#febc2e" : "#ddd",
            }}
            aria-label="Minimize window"
          >
            {showBtns && (
              <svg width="6" height="2" viewBox="0 0 6 2" fill="none">
                <path d="M0.5 1H5.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMaximize()
            }}
            className="flex h-3 w-3 items-center justify-center rounded-full transition-colors"
            style={{
              background: isActive ? "#28c840" : "#ddd",
            }}
            aria-label="Maximize window"
          >
            {showBtns && (
              <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                <path d="M1 3L1 1H3M7 5V7H5M1 5V7H3M7 3V1H5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.1" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 text-center text-[13px] font-medium text-[#4a4a4a]">
          {APP_TITLES[appId]}
        </div>
        <div className="w-14" />
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-auto">
        {AppContent ? <AppContent /> : null}
      </div>

      {/* Resize Handle */}
      {!maximized && (
        <div
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
          onMouseDown={handleMouseDownResize}
        />
      )}
    </div>
  )
}
