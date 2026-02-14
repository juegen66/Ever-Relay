"use client"

import { useState, useEffect } from "react"
import {
  Apple,
  Wifi,
  Battery,
  Search,
  Volume2,
} from "lucide-react"
import type { AppId } from "./types"

const APP_NAMES: Record<AppId, string> = {
  finder: "Finder",
  calculator: "Calculator",
  notes: "Notes",
  terminal: "Terminal",
  safari: "Safari",
  settings: "System Settings",
  photos: "Photos",
}

export function MenuBar({ activeApp }: { activeApp: AppId | null }) {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const appName = activeApp ? APP_NAMES[activeApp] : "Finder"

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex h-7 items-center justify-between px-4 text-[13px] font-medium text-white"
      style={{
        background: "rgba(30, 30, 30, 0.45)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      <div className="flex items-center gap-5">
        <Apple className="h-[14px] w-[14px] fill-white" />
        <span className="font-semibold">{appName}</span>
        <span className="opacity-90">File</span>
        <span className="opacity-90">Edit</span>
        <span className="opacity-90">View</span>
        <span className="opacity-90">Go</span>
        <span className="opacity-90">Window</span>
        <span className="opacity-90">Help</span>
      </div>
      <div className="flex items-center gap-4">
        <Battery className="h-[15px] w-[15px] opacity-90" />
        <Wifi className="h-[14px] w-[14px] opacity-90" />
        <Volume2 className="h-[14px] w-[14px] opacity-90" />
        <Search className="h-[14px] w-[14px] opacity-90" />
        <span className="opacity-90">{date}</span>
        <span className="opacity-90">{time}</span>
      </div>
    </div>
  )
}
