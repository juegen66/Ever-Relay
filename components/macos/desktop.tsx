"use client"

import { useState, useCallback } from "react"
import { MenuBar } from "./menu-bar"
import { Dock } from "./dock"
import { AppWindow } from "./app-window"
import type { AppId, WindowState } from "./types"

const DEFAULT_WINDOW_SIZE: Record<AppId, { w: number; h: number }> = {
  finder: { w: 720, h: 460 },
  calculator: { w: 260, h: 380 },
  notes: { w: 560, h: 440 },
  terminal: { w: 620, h: 420 },
  safari: { w: 820, h: 540 },
  settings: { w: 680, h: 480 },
  photos: { w: 700, h: 500 },
}

export function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [nextZIndex, setNextZIndex] = useState(1)
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)

  const openApp = useCallback(
    (appId: AppId) => {
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

      const size = DEFAULT_WINDOW_SIZE[appId] || { w: 600, h: 400 }
      const id = `${appId}-${Date.now()}`
      const offset = (windows.length % 8) * 30
      const newWindow: WindowState = {
        id,
        appId,
        x: 120 + offset,
        y: 60 + offset,
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
    setActiveWindowId(null)
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    )
    setActiveWindowId(null)
  }, [])

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
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

  const activeApp = windows.find((w) => w.id === activeWindowId)?.appId || null

  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundImage: "url(/images/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <MenuBar activeApp={activeApp} />

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

      <Dock openApp={openApp} openWindows={windows} />
    </div>
  )
}
