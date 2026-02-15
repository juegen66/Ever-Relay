"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { MenuBar } from "./menu-bar"
import { Dock } from "./dock"
import { AppWindow } from "./app-window"
import { ContextMenu } from "./context-menu"
import { DesktopIcon, type DesktopFolder } from "./desktop-icon"
import { Spotlight } from "./spotlight"
import { BootScreen } from "./boot-screen"
import { Launchpad } from "./launchpad"
import { AboutMac } from "./about-mac"
import { NotificationPopup, type NotificationItem } from "./notification-center"
import type { AppId, WindowState } from "./types"
import type { User } from "@/lib/auth-store"

const DEFAULT_WINDOW_SIZE: Record<AppId, { w: number; h: number }> = {
  finder: { w: 780, h: 480 },
  calculator: { w: 260, h: 400 },
  notes: { w: 680, h: 500 },
  terminal: { w: 660, h: 440 },
  safari: { w: 900, h: 580 },
  settings: { w: 740, h: 520 },
  photos: { w: 780, h: 540 },
  music: { w: 820, h: 520 },
  calendar: { w: 760, h: 520 },
  mail: { w: 820, h: 540 },
  weather: { w: 420, h: 520 },
  clock: { w: 340, h: 380 },
  maps: { w: 780, h: 520 },
  appstore: { w: 820, h: 560 },
  messages: { w: 700, h: 500 },
}

const STARTUP_NOTIFICATIONS: Omit<NotificationItem, "id">[] = [
  { app: "Mail", title: "New Email", message: "Sarah Johnson: Q1 Report Review - I've attached the Q1 report for your review...", time: "now", iconColor: "#007aff" },
  { app: "Messages", title: "Sarah", message: "See you tomorrow!", time: "2m ago", iconColor: "#34c759" },
  { app: "Calendar", title: "Upcoming Event", message: "Team Standup in 30 minutes", time: "5m ago", iconColor: "#ff3b30" },
]

export function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [nextZIndex, setNextZIndex] = useState(1)
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [showLaunchpad, setShowLaunchpad] = useState(false)
  const [showAboutMac, setShowAboutMac] = useState(false)
  const [desktopReady, setDesktopReady] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [bouncingApp, setBouncingApp] = useState<AppId | null>(null)
  const [desktopFolders, setDesktopFolders] = useState<DesktopFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const desktopRef = useRef<HTMLDivElement>(null)
  const notificationQueueRef = useRef<Omit<NotificationItem, "id">[]>([])

  useEffect(() => {
    if (booted) {
      setTimeout(() => setDesktopReady(true), 100)
      // Queue startup notifications with delays
      notificationQueueRef.current = [...STARTUP_NOTIFICATIONS]
      const showNext = (delay: number) => {
        setTimeout(() => {
          const next = notificationQueueRef.current.shift()
          if (next) {
            setNotifications((prev) => [...prev, { ...next, id: String(Date.now()) }])
            if (notificationQueueRef.current.length > 0) {
              showNext(6000)
            }
          }
        }, delay)
      }
      showNext(2000)
    }
  }, [booted])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === " ") {
        e.preventDefault()
        setShowSpotlight((prev) => !prev)
        setShowLaunchpad(false)
      }
      if (e.key === "Escape") {
        setShowSpotlight(false)
        setShowLaunchpad(false)
        setContextMenu(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const openApp = useCallback(
    (appId: AppId) => {
      setShowSpotlight(false)
      setShowLaunchpad(false)
      setContextMenu(null)

      const existing = windows.find((w) => w.appId === appId && !w.minimized)
      if (existing) {
        focusWindow(existing.id)
        return
      }
      const minimized = windows.find((w) => w.appId === appId && w.minimized)
      if (minimized) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === minimized.id ? { ...w, minimized: false, zIndex: nextZIndex } : w
          )
        )
        setActiveWindowId(minimized.id)
        setNextZIndex((z) => z + 1)
        return
      }

      // Bounce animation
      setBouncingApp(appId)
      setTimeout(() => setBouncingApp(null), 600)

      const size = DEFAULT_WINDOW_SIZE[appId] || { w: 600, h: 400 }
      const id = `${appId}-${Date.now()}`
      const offset = (windows.length % 6) * 28
      const viewW = window.innerWidth
      const viewH = window.innerHeight
      const newWindow: WindowState = {
        id,
        appId,
        x: Math.max(40, (viewW - size.w) / 2 + offset),
        y: Math.max(40, (viewH - size.h) / 2 - 60 + offset),
        width: size.w,
        height: size.h,
        zIndex: nextZIndex,
        minimized: false,
        maximized: false,
      }
      setWindows((prev) => [...prev, newWindow])
      setActiveWindowId(id)
      setNextZIndex((z) => z + 1)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [windows, nextZIndex]
  )

  const focusWindow = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex } : w))
      )
      setActiveWindowId(id)
      setNextZIndex((z) => z + 1)
    },
    [nextZIndex]
  )

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
    setActiveWindowId((prev) => (prev === id ? null : prev))
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    )
    setActiveWindowId((prev) => (prev === id ? null : prev))
  }, [])

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.prevBounds?.x ?? w.x,
            y: w.prevBounds?.y ?? w.y,
            width: w.prevBounds?.width ?? w.width,
            height: w.prevBounds?.height ?? w.height,
          }
        }
        return {
          ...w,
          maximized: true,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
        }
      })
    )
  }, [])

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w))
    )
  }, [])

  const updateWindowSize = useCallback(
    (id: string, width: number, height: number) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, width, height } : w))
      )
    },
    []
  )

  const createFolder = useCallback((x: number, y: number) => {
    const id = `folder-${Date.now()}`
    // Snap to a grid aligned position, clamped to desktop area
    const snappedX = Math.min(Math.max(x - 45, 20), window.innerWidth - 110)
    const snappedY = Math.min(Math.max(y - 40, 36), window.innerHeight - 140)
    setDesktopFolders((prev) => [
      ...prev,
      { id, name: "untitled folder", x: snappedX, y: snappedY, isNew: true },
    ])
    setSelectedFolderId(id)
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setDesktopFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name, isNew: false } : f))
    )
  }, [])

  const moveFolder = useCallback((id: string, x: number, y: number) => {
    setDesktopFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    )
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleDesktopClick = useCallback(() => {
    setContextMenu(null)
    setActiveWindowId(null)
    setSelectedFolderId(null)
  }, [])

  const activeApp = windows.find((w) => w.id === activeWindowId)?.appId || null

  if (!booted) {
    return <BootScreen onComplete={(user) => { setCurrentUser(user); setBooted(true) }} />
  }

  return (
    <div
      ref={desktopRef}
      className="desktop-container relative h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundImage: "url(/images/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: desktopReady ? 1 : 0,
        transition: "opacity 0.8s ease-in-out",
      }}
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      <MenuBar
        activeApp={activeApp}
        openApp={openApp}
        onShowAbout={() => setShowAboutMac(true)}
        onShowLaunchpad={() => setShowLaunchpad(true)}
        currentUser={currentUser}
      />

      {windows.map((win) =>
        win.minimized ? null : (
          <AppWindow
            key={win.id}
            windowState={win}
            isActive={win.id === activeWindowId}
            onFocus={() => focusWindow(win.id)}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => maximizeWindow(win.id)}
            onMove={(x, y) => updateWindowPosition(win.id, x, y)}
            onResize={(w, h) => updateWindowSize(win.id, w, h)}
          />
        )
      )}

      {/* Desktop folder icons */}
      {desktopFolders.map((folder) => (
        <DesktopIcon
          key={folder.id}
          folder={folder}
          selected={selectedFolderId === folder.id}
          onSelect={() => setSelectedFolderId(folder.id)}
          onDoubleClick={() => openApp("finder")}
          onRename={renameFolder}
          onMove={moveFolder}
        />
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={(action) => {
            if (action === "new-folder") createFolder(contextMenu.x, contextMenu.y)
            if (action === "finder") openApp("finder")
            if (action === "terminal") openApp("terminal")
            if (action === "settings") openApp("settings")
            setContextMenu(null)
          }}
        />
      )}

      {showSpotlight && (
        <Spotlight
          onClose={() => setShowSpotlight(false)}
          onOpenApp={openApp}
        />
      )}

      {showLaunchpad && (
        <Launchpad
          onClose={() => setShowLaunchpad(false)}
          onOpenApp={openApp}
        />
      )}

      {showAboutMac && (
        <AboutMac onClose={() => setShowAboutMac(false)} />
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <NotificationPopup
          notification={notifications[notifications.length - 1]}
          onDismiss={() => dismissNotification(notifications[notifications.length - 1].id)}
        />
      )}

      <Dock
        openApp={openApp}
        openWindows={windows}
        activeWindowId={activeWindowId}
        bouncingApp={bouncingApp}
      />
    </div>
  )
}
