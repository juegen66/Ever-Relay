"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"

import { usePathname } from "next/navigation"

import { toDesktopFolder } from "@/lib/desktop-items"
import { useDesktopItemsQuery } from "@/lib/query/files"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

import { ActionLogDebugPanel } from "../ai/action-log-debug-panel"
import { AboutMac } from "./about-mac"
import { AppWindow } from "./app-window"
import { ContextMenu } from "./context-menu"
import { DesktopIcon } from "./desktop-icon"
import { Dock } from "./dock"
import { Launchpad } from "./launchpad"
import { NotificationPopup, type NotificationItem } from "./notification-center"
import { Spotlight } from "./spotlight"

type FolderNativeDragStartDetail = {
  itemId: string
}

const STARTUP_NOTIFICATIONS: Omit<NotificationItem, "id">[] = [
  { app: "vibecoding", title: "Build Complete", message: "Landing page draft generated and ready for review.", time: "now", iconColor: "#22c55e" },
  { app: "Canvas", title: "Project Synced", message: "Latest edits are saved to your active canvas project.", time: "2m ago", iconColor: "#ff7a00" },
  { app: "Finder", title: "Desktop Ready", message: "Your workspace files are available from Finder.", time: "5m ago", iconColor: "#1e90ff" },
]

export function Desktop() {
  const pathname = usePathname()
  const isFullscreenOverlayRoute = pathname === "/desktop/chat" || pathname === "/desktop/workflow"

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
  const fitWindowsToViewport = useDesktopWindowStore((state) => state.fitWindowsToViewport)

  const desktopItemsQuery = useDesktopItemsQuery()
  const pendingRenameItemIds = useDesktopItemsStore((state) => state.pendingRenameItemIds)
  const selectedFolderId = useDesktopItemsStore((state) => state.selectedFolderId)
  const setSelectedFolderId = useDesktopItemsStore((state) => state.setSelectedFolderId)
  const clearSelection = useDesktopItemsStore((state) => state.clearSelection)
  const createFolder = useDesktopItemsStore((state) => state.createFolder)
  const createFile = useDesktopItemsStore((state) => state.createFile)
  const deleteItem = useDesktopItemsStore((state) => state.deleteItem)
  const renameItem = useDesktopItemsStore((state) => state.renameItem)
  const moveItem = useDesktopItemsStore((state) => state.moveItem)
  const persistItemPosition = useDesktopItemsStore((state) => state.persistItemPosition)
  const moveItemToFolder = useDesktopItemsStore((state) => state.moveItemToFolder)
  const moveIntoFolder = useDesktopItemsStore((state) => state.moveIntoFolder)
  const moveItemToDesktop = useDesktopItemsStore((state) => state.moveItemToDesktop)
  const moveItemToDesktopAt = useDesktopItemsStore((state) => state.moveItemToDesktopAt)
  const createItemInFolder = useDesktopItemsStore((state) => state.createItemInFolder)

  const desktopFolders = useMemo(() => {
    return (desktopItemsQuery.data ?? []).map((item) => {
      return toDesktopFolder(item, Boolean(pendingRenameItemIds[item.id]))
    })
  }, [desktopItemsQuery.data, pendingRenameItemIds])

  const contextMenu = useDesktopUIStore((state) => state.contextMenu)
  const setContextMenu = useDesktopUIStore((state) => state.setContextMenu)
  const closeContextMenu = useDesktopUIStore((state) => state.closeContextMenu)
  const showSpotlight = useDesktopUIStore((state) => state.showSpotlight)
  const showLaunchpad = useDesktopUIStore((state) => state.showLaunchpad)
  const showAboutMac = useDesktopUIStore((state) => state.showAboutMac)
  const setShowAboutMac = useDesktopUIStore((state) => state.setShowAboutMac)
  const toggleSpotlight = useDesktopUIStore((state) => state.toggleSpotlight)
  const closeTransientUi = useDesktopUIStore((state) => state.closeTransientUi)

  const [desktopReady, setDesktopReady] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const desktopRef = useRef<HTMLDivElement>(null)
  const notificationQueueRef = useRef<Omit<NotificationItem, "id">[]>([])
  const activeNativeDragItemIdRef = useRef<string | null>(null)
  const desktopItemsRef = useRef(desktopFolders)
  const moveItemToDesktopAtRef = useRef(moveItemToDesktopAt)

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreenOverlayRoute) {
        return
      }

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
  }, [toggleSpotlight, closeTransientUi, isFullscreenOverlayRoute])

  useEffect(() => {
    const handleResize = () => {
      fitWindowsToViewport()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [fitWindowsToViewport])

  useEffect(() => {
    const handleNativeDragStart = (event: Event) => {
      const detail = (event as CustomEvent<FolderNativeDragStartDetail>).detail
      activeNativeDragItemIdRef.current = detail?.itemId ?? null
    }

    const handleNativeDragEnd = () => {
      activeNativeDragItemIdRef.current = null
    }

    window.addEventListener("folder-native-drag-start", handleNativeDragStart)
    window.addEventListener("folder-native-drag-end", handleNativeDragEnd)
    return () => {
      window.removeEventListener("folder-native-drag-start", handleNativeDragStart)
      window.removeEventListener("folder-native-drag-end", handleNativeDragEnd)
    }
  }, [])

  useEffect(() => {
    desktopItemsRef.current = desktopFolders
    moveItemToDesktopAtRef.current = moveItemToDesktopAt
  }, [desktopFolders, moveItemToDesktopAt])

  useEffect(() => {
    const isDesktopBackgroundTarget = (x: number, y: number) => {
      const desktopEl = desktopRef.current
      if (!desktopEl) return false

      const element = document.elementFromPoint(x, y) as HTMLElement | null
      if (!element) return false
      if (!desktopEl.contains(element)) return false

      if (element.closest("[data-folder-dropzone-id]")) return false
      if (element.closest(".animate-window-open")) return false
      return true
    }

    const handleWindowDragOver = (event: DragEvent) => {
      const itemId = activeNativeDragItemIdRef.current
      if (!itemId || !isDesktopBackgroundTarget(event.clientX, event.clientY)) return

      const item = desktopItemsRef.current.find((f) => f.id === itemId)
      if (!item || !item.parentId) return

      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move"
      }
    }

    const handleWindowDrop = (event: DragEvent) => {
      const itemId = activeNativeDragItemIdRef.current
      if (!itemId || !isDesktopBackgroundTarget(event.clientX, event.clientY)) return

      const item = desktopItemsRef.current.find((f) => f.id === itemId)
      if (!item || !item.parentId) return

      event.preventDefault()
      void moveItemToDesktopAtRef.current(itemId, event.clientX, event.clientY)
      activeNativeDragItemIdRef.current = null
    }

    window.addEventListener("dragover", handleWindowDragOver)
    window.addEventListener("drop", handleWindowDrop)
    return () => {
      window.removeEventListener("dragover", handleWindowDragOver)
      window.removeEventListener("drop", handleWindowDrop)
    }
  }, [])

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
    onMoveItemToFolder: moveItemToFolder,
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

  return (
    <div
      ref={desktopRef}
      data-desktop-root
      className="desktop-container relative h-screen w-full overflow-hidden select-none"
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
      {windows.map((win) => (
        <div key={win.id} style={win.minimized ? { display: "none" } : undefined}>
          <AppWindow
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
        </div>
      ))}

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
              openApp("finder")
            }
          }}
          onRename={(id, name) => {
            void renameItem(id, name)
          }}
          onDelete={(id) => {
            void deleteItem(id)
          }}
          onMove={(id, x, y) => {
            void moveItem(id, x, y)
          }}
          onMoveEnd={(id, x, y) => {
            void persistItemPosition(id, x, y)
          }}
          onMoveIntoFolder={(itemId, targetFolderId) => {
            void moveIntoFolder(itemId, targetFolderId)
          }}
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
            useDesktopActionLogStore.getState().logAction({ type: "context_menu_action", action })
            if (action === "new-folder") void createFolder(x, y)
            if (action === "new-file-text") void createFile(x, y, "text")
            if (action === "new-file-image") void createFile(x, y, "image")
            if (action === "new-file-code") void createFile(x, y, "code")
            if (action === "new-file-spreadsheet") void createFile(x, y, "spreadsheet")
            if (action === "new-file-generic") void createFile(x, y, "generic")
            if (action === "finder") openApp("finder")
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

      <ActionLogDebugPanel />
    </div>
  )
}
