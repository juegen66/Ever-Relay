"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Dock } from "./dock"
import { AppWindow } from "./app-window"
import { ContextMenu } from "./context-menu"
import { DesktopIcon } from "./desktop-icon"
import { Spotlight } from "./spotlight"
import { BootScreen } from "./boot-screen"
import { Launchpad } from "./launchpad"
import { AboutMac } from "./about-mac"
import { NotificationPopup, type NotificationItem } from "./notification-center"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { useUserStore } from "@/lib/stores/user-store"

const STARTUP_NOTIFICATIONS: Omit<NotificationItem, "id">[] = [
  { app: "Mail", title: "New Email", message: "Sarah Johnson: Q1 Report Review - I've attached the Q1 report for your review...", time: "now", iconColor: "#007aff" },
  { app: "Messages", title: "Sarah", message: "See you tomorrow!", time: "2m ago", iconColor: "#34c759" },
  { app: "Calendar", title: "Upcoming Event", message: "Team Standup in 30 minutes", time: "5m ago", iconColor: "#ff3b30" },
]

export function Desktop() {
  const windows = useDesktopWindowStore((state) => state.windows)
  const activeWindowId = useDesktopWindowStore((state) => state.activeWindowId)
  const openApp = useDesktopWindowStore((state) => state.openApp)
  const openFolderWindow = useDesktopWindowStore((state) => state.openFolderWindow)
  const openFileWindow = useDesktopWindowStore((state) => state.openFileWindow)
  const focusWindow = useDesktopWindowStore((state) => state.focusWindow)
  const closeWindow = useDesktopWindowStore((state) => state.closeWindow)
  const minimizeWindow = useDesktopWindowStore((state) => state.minimizeWindow)
  const maximizeWindow = useDesktopWindowStore((state) => state.maximizeWindow)
  const updateWindowPosition = useDesktopWindowStore((state) => state.updateWindowPosition)
  const updateWindowSize = useDesktopWindowStore((state) => state.updateWindowSize)
  const clearActiveWindow = useDesktopWindowStore((state) => state.clearActiveWindow)

  const desktopFolders = useDesktopItemsStore((state) => state.desktopFolders)
  const selectedFolderId = useDesktopItemsStore((state) => state.selectedFolderId)
  const setSelectedFolderId = useDesktopItemsStore((state) => state.setSelectedFolderId)
  const clearSelection = useDesktopItemsStore((state) => state.clearSelection)
  const createFolder = useDesktopItemsStore((state) => state.createFolder)
  const createFile = useDesktopItemsStore((state) => state.createFile)
  const deleteItem = useDesktopItemsStore((state) => state.deleteItem)
  const renameItem = useDesktopItemsStore((state) => state.renameItem)
  const moveItem = useDesktopItemsStore((state) => state.moveItem)
  const persistItemPosition = useDesktopItemsStore((state) => state.persistItemPosition)
  const moveIntoFolder = useDesktopItemsStore((state) => state.moveIntoFolder)
  const moveItemToDesktop = useDesktopItemsStore((state) => state.moveItemToDesktop)
  const createItemInFolder = useDesktopItemsStore((state) => state.createItemInFolder)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)
  const loading = useDesktopItemsStore((state) => state.loading)

  const contextMenu = useDesktopUIStore((state) => state.contextMenu)
  const setContextMenu = useDesktopUIStore((state) => state.setContextMenu)
  const closeContextMenu = useDesktopUIStore((state) => state.closeContextMenu)
  const showSpotlight = useDesktopUIStore((state) => state.showSpotlight)
  const showLaunchpad = useDesktopUIStore((state) => state.showLaunchpad)
  const showAboutMac = useDesktopUIStore((state) => state.showAboutMac)
  const setShowAboutMac = useDesktopUIStore((state) => state.setShowAboutMac)
  const toggleSpotlight = useDesktopUIStore((state) => state.toggleSpotlight)
  const closeTransientUi = useDesktopUIStore((state) => state.closeTransientUi)

  const setCurrentUser = useUserStore((state) => state.setCurrentUser)

  const [booted, setBooted] = useState(false)
  const [desktopReady, setDesktopReady] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const desktopRef = useRef<HTMLDivElement>(null)
  const notificationQueueRef = useRef<Omit<NotificationItem, "id">[]>([])

  // Fetch desktop items when booted
  useEffect(() => {
    if (booted) {
      fetchItems()
    }
  }, [booted, fetchItems])

  useEffect(() => {
    if (booted) {
      setTimeout(() => setDesktopReady(true), 100)
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
        toggleSpotlight()
      }
      if (e.key === "Escape") {
        closeTransientUi()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSpotlight, closeTransientUi])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const folderViewerProps = {
    allItems: desktopFolders,
    onOpenFolder: openFolderWindow,
    onOpenFile: openFileWindow,
    onCreateItem: createItemInFolder,
    onDeleteItem: deleteItem,
    onRenameItem: renameItem,
    onMoveItemOut: moveItemToDesktop,
  }

  const rootDesktopItems = desktopFolders.filter((item) => !item.parentId)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [setContextMenu])

  const handleDesktopClick = useCallback(() => {
    closeContextMenu()
    clearActiveWindow()
    clearSelection()
  }, [closeContextMenu, clearActiveWindow, clearSelection])

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
            folderViewerProps={win.folderId ? folderViewerProps : undefined}
          />
        )
      )}

      {rootDesktopItems.map((folder) => (
        <DesktopIcon
          key={folder.id}
          folder={folder}
          selected={selectedFolderId === folder.id}
          onSelect={() => setSelectedFolderId(folder.id)}
          onDoubleClick={() => {
            if (folder.itemType === "folder") {
              openFolderWindow(folder.id, folder.name)
            } else if (folder.itemType === "text") {
              openFileWindow(folder.id, folder.name)
            } else {
              openApp("notes")
            }
          }}
          onRename={renameItem}
          onDelete={deleteItem}
          onMove={moveItem}
          onMoveEnd={persistItemPosition}
          onMoveIntoFolder={moveIntoFolder}
          allDesktopItems={rootDesktopItems}
        />
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onAction={(action) => {
            const { x, y } = contextMenu
            if (action === "new-folder") createFolder(x, y)
            if (action === "new-file-text") createFile(x, y, "text")
            if (action === "new-file-image") createFile(x, y, "image")
            if (action === "new-file-code") createFile(x, y, "code")
            if (action === "new-file-spreadsheet") createFile(x, y, "spreadsheet")
            if (action === "new-file-generic") createFile(x, y, "generic")
            if (action === "finder") openApp("finder")
            if (action === "terminal") openApp("terminal")
            if (action === "settings") openApp("settings")
            closeContextMenu()
          }}
        />
      )}

      {showSpotlight && <Spotlight />}

      {showLaunchpad && <Launchpad />}

      {showAboutMac && <AboutMac onClose={() => setShowAboutMac(false)} />}

      {notifications.length > 0 && (
        <NotificationPopup
          notification={notifications[notifications.length - 1]}
          onDismiss={() => dismissNotification(notifications[notifications.length - 1].id)}
        />
      )}

      <Dock />
    </div>
  )
}
