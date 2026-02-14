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
import { MusicApp } from "./apps/music-app"
import { CalendarApp } from "./apps/calendar-app"
import { MailApp } from "./apps/mail-app"
import { WeatherApp } from "./apps/weather-app"
import { ClockApp } from "./apps/clock-app"
import { MapsApp } from "./apps/maps-app"
import { AppStoreApp } from "./apps/appstore-app"
import { MessagesApp } from "./apps/messages-app"

const APP_TITLES: Record<string, string> = {
  finder: "Finder",
  calculator: "Calculator",
  notes: "Notes",
  terminal: "Terminal",
  safari: "Safari",
  settings: "System Settings",
  photos: "Photos",
  music: "Music",
  calendar: "Calendar",
  mail: "Mail",
  weather: "Weather",
  clock: "Clock",
  maps: "Maps",
  appstore: "App Store",
  messages: "Messages",
}

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  finder: FinderApp,
  calculator: CalculatorApp,
  notes: NotesApp,
  terminal: TerminalApp,
  safari: SafariApp,
  settings: SettingsApp,
  photos: PhotosApp,
  music: MusicApp,
  calendar: CalendarApp,
  mail: MailApp,
  weather: WeatherApp,
  clock: ClockApp,
  maps: MapsApp,
  appstore: AppStoreApp,
  messages: MessagesApp,
}

// Dark title bar apps
const DARK_TITLEBAR_APPS = new Set(["terminal", "calculator", "music", "maps"])

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
  const isResizing = useRef<string | false>(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const [showBtns, setShowBtns] = useState(false)
  const { x, y, width, height, zIndex, maximized, appId } = windowState
  const isDark = DARK_TITLEBAR_APPS.has(appId)

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
        const newY = Math.max(26, e.clientY - dragStart.current.y)
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

  const AppContent = APP_COMPONENTS[appId]

  const windowStyle = maximized
    ? {
        top: 26,
        left: 0,
        width: "100vw" as const,
        height: "calc(100vh - 26px)" as const,
        zIndex,
      }
    : { top: y, left: x, width, height, zIndex }

  const titleBarBg = isDark
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
        background: isDark
          ? isActive
            ? "rgba(30, 30, 30, 0.96)"
            : "rgba(40, 40, 40, 0.92)"
          : isActive
            ? "rgba(246, 246, 246, 0.94)"
            : "rgba(246, 246, 246, 0.88)",
        backdropFilter: "blur(50px) saturate(180%)",
        WebkitBackdropFilter: "blur(50px) saturate(180%)",
        border: isActive
          ? "0.5px solid rgba(0,0,0,0.22)"
          : "0.5px solid rgba(0,0,0,0.12)",
        boxShadow: isActive
          ? "0 22px 70px 4px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.12)"
          : "0 5px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        transition: maximized
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
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
        }}
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={onMaximize}
      >
        {/* Traffic Lights */}
        <div
          className="flex items-center gap-[7px] mr-3"
          onMouseEnter={() => setShowBtns(true)}
          onMouseLeave={() => setShowBtns(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: isActive ? "#ff5f57" : isDark ? "#555" : "#ddd" }}
            aria-label="Close window"
          >
            {showBtns && (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(80,0,0,0.6)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: isActive ? "#febc2e" : isDark ? "#555" : "#ddd" }}
            aria-label="Minimize window"
          >
            {showBtns && (
              <svg width="7" height="1" viewBox="0 0 7 1" fill="none">
                <path d="M0.5 0.5H6.5" stroke="rgba(80,50,0,0.6)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMaximize() }}
            className="group flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all"
            style={{ background: isActive ? "#28c840" : isDark ? "#555" : "#ddd" }}
            aria-label="Maximize window"
          >
            {showBtns && (
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                <path d="M1 4V1.5C1 1.22 1.22 1 1.5 1H4M7 4V6.5C7 6.78 6.78 7 6.5 7H4M4 1L1 4M4 7L7 4"
                  stroke="rgba(0,60,0,0.6)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        <div className={`flex-1 text-center text-[13px] font-medium ${isDark ? "text-white/60" : "text-[#4a4a4a]"}`}>
          {APP_TITLES[appId]}
        </div>
        <div className="w-[62px]" />
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        {AppContent ? <AppContent /> : null}
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
