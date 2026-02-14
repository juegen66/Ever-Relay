"use client"

import { useState, useRef } from "react"
import {
  Folder,
  Calculator,
  StickyNote,
  TerminalSquare,
  Globe,
  Settings,
  Image as ImageIcon,
} from "lucide-react"
import type { AppId, WindowState } from "./types"

interface DockItem {
  id: AppId
  name: string
  icon: React.ReactNode
  color: string
}

const DOCK_ITEMS: DockItem[] = [
  {
    id: "finder",
    name: "Finder",
    icon: <Folder className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #1e90ff 0%, #4169e1 100%)",
  },
  {
    id: "safari",
    name: "Safari",
    icon: <Globe className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)",
  },
  {
    id: "notes",
    name: "Notes",
    icon: <StickyNote className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #f9c74f 0%, #f3722c 100%)",
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: <Calculator className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #555 0%, #333 100%)",
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: <TerminalSquare className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  },
  {
    id: "photos",
    name: "Photos",
    icon: <ImageIcon className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings className="h-7 w-7 text-white" />,
    color: "linear-gradient(135deg, #636e72 0%, #2d3436 100%)",
  },
]

export function Dock({
  openApp,
  openWindows,
}: {
  openApp: (id: AppId) => void
  openWindows: WindowState[]
}) {
  const dockRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mouseX, setMouseX] = useState<number | null>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dockRef.current) return
    const rect = dockRef.current.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setMouseX(null)
  }

  const getScale = (index: number) => {
    if (mouseX === null || !dockRef.current) return 1
    const itemWidth = 56
    const itemCenter = index * itemWidth + itemWidth / 2 + 12
    const distance = Math.abs(mouseX - itemCenter)
    const maxDist = 120
    if (distance > maxDist) return 1
    return 1 + 0.5 * (1 - distance / maxDist)
  }

  return (
    <div className="fixed bottom-2 left-1/2 z-[9998] -translate-x-1/2">
      <div
        ref={dockRef}
        className="flex items-end gap-1 rounded-2xl px-3 pb-2 pt-2"
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {DOCK_ITEMS.map((item, index) => {
          const scale = getScale(index)
          const isOpen = openWindows.some((w) => w.appId === item.id)
          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div
                  className="absolute -top-8 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-white"
                  style={{
                    background: "rgba(30, 30, 30, 0.75)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {item.name}
                </div>
              )}
              <button
                onClick={() => openApp(item.id)}
                className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform duration-150 ease-out active:scale-90"
                style={{
                  background: item.color,
                  transform: `scale(${scale})`,
                  transformOrigin: "bottom",
                }}
                aria-label={`Open ${item.name}`}
              >
                {item.icon}
              </button>
              {isOpen && (
                <div className="mt-1 h-1 w-1 rounded-full bg-white/80" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
