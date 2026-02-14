"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Apple,
  Wifi,
  Battery,
  Search,
  Volume2,
  Bluetooth,
  Moon,
  Sun,
  Monitor,
  Play,
  SkipForward,
  SkipBack,
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
  music: "Music",
  calendar: "Calendar",
  mail: "Mail",
  weather: "Weather",
  clock: "Clock",
  maps: "Maps",
  appstore: "App Store",
  messages: "Messages",
}

const APPLE_MENU = [
  { label: "About This Mac", action: "about" },
  { type: "separator" as const },
  { label: "System Settings...", action: "settings" },
  { label: "App Store...", action: "appstore" },
  { type: "separator" as const },
  { label: "Recent Items", action: "recent", hasSubmenu: true },
  { type: "separator" as const },
  { label: "Force Quit...", action: "force-quit" },
  { type: "separator" as const },
  { label: "Sleep", action: "sleep" },
  { label: "Restart...", action: "restart" },
  { label: "Shut Down...", action: "shutdown" },
  { type: "separator" as const },
  { label: "Lock Screen", action: "lock" },
  { label: "Log Out User...", action: "logout" },
]

const FILE_MENU = [
  { label: "New Window", shortcut: "N" },
  { label: "New Tab", shortcut: "T" },
  { type: "separator" as const },
  { label: "Open...", shortcut: "O" },
  { label: "Open Recent", hasSubmenu: true },
  { type: "separator" as const },
  { label: "Close Window", shortcut: "W" },
  { label: "Save", shortcut: "S" },
  { type: "separator" as const },
  { label: "Print...", shortcut: "P" },
]

const EDIT_MENU = [
  { label: "Undo", shortcut: "Z" },
  { label: "Redo", shortcut: "Z", shift: true },
  { type: "separator" as const },
  { label: "Cut", shortcut: "X" },
  { label: "Copy", shortcut: "C" },
  { label: "Paste", shortcut: "V" },
  { label: "Select All", shortcut: "A" },
  { type: "separator" as const },
  { label: "Find...", shortcut: "F" },
]

const VIEW_MENU = [
  { label: "as Icons" },
  { label: "as List" },
  { label: "as Columns" },
  { label: "as Gallery" },
  { type: "separator" as const },
  { label: "Show Sidebar" },
  { label: "Show Preview" },
  { type: "separator" as const },
  { label: "Enter Full Screen" },
]

interface MenuBarProps {
  activeApp: AppId | null
  openApp: (id: AppId) => void
  onShowAbout?: () => void
  onShowLaunchpad?: () => void
}

export function MenuBar({ activeApp, openApp, onShowAbout, onShowLaunchpad }: MenuBarProps) {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showControlCenter, setShowControlCenter] = useState(false)
  const menuBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      )
      setDate(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
        setShowControlCenter(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const appName = activeApp ? APP_NAMES[activeApp] : "Finder"

  const handleMenuAction = useCallback((action?: string) => {
    setOpenMenu(null)
    if (action === "about" && onShowAbout) onShowAbout()
    if (action === "settings") openApp("settings")
    if (action === "appstore") openApp("appstore")
  }, [openApp, onShowAbout])

  const renderMenu = (items: typeof APPLE_MENU) => (
    <div
      className="absolute top-full left-0 mt-0 min-w-[220px] py-1 z-[10002]"
      style={{
        background: "rgba(236, 236, 236, 0.92)",
        backdropFilter: "blur(50px) saturate(180%)",
        WebkitBackdropFilter: "blur(50px) saturate(180%)",
        borderRadius: "0 0 6px 6px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.1)",
      }}
    >
      {items.map((item, i) => {
        if (item.type === "separator") {
          return <div key={`sep-${i}`} className="my-1 mx-2 h-px" style={{ background: "rgba(0,0,0,0.1)" }} />
        }
        return (
          <button
            key={`item-${i}`}
            onClick={() => handleMenuAction("action" in item ? item.action : undefined)}
            className="flex w-full items-center justify-between px-4 py-1 text-[13px] text-[#262626] hover:bg-[#0058d0] hover:text-white transition-colors"
          >
            <span>{item.label}</span>
            <span className="flex items-center gap-1 text-[12px] opacity-50">
              {"shortcut" in item && item.shortcut && (
                <>
                  {"shift" in item && item.shift && <span>Shift+</span>}
                  <span>Cmd+{item.shortcut}</span>
                </>
              )}
              {"hasSubmenu" in item && item.hasSubmenu && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      ref={menuBarRef}
      className="fixed top-0 left-0 right-0 z-[9999] flex h-[26px] items-center justify-between px-4 text-[13px] font-medium text-white"
      style={{
        background: "rgba(30, 30, 30, 0.35)",
        backdropFilter: "blur(50px) saturate(200%)",
        WebkitBackdropFilter: "blur(50px) saturate(200%)",
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-0">
        {/* Apple Menu */}
        <div className="relative">
          <button
            className="flex items-center rounded px-2 py-0.5 transition-colors hover:bg-white/10"
            onClick={() => setOpenMenu(openMenu === "apple" ? null : "apple")}
            onMouseEnter={() => openMenu && setOpenMenu("apple")}
          >
            <Apple className="h-[13px] w-[13px] fill-white" />
          </button>
          {openMenu === "apple" && renderMenu(APPLE_MENU)}
        </div>

        {/* App Name */}
        <div className="relative">
          <button
            className="rounded px-2 py-0.5 font-semibold transition-colors hover:bg-white/10"
            onClick={() => setOpenMenu(openMenu === "app" ? null : "app")}
            onMouseEnter={() => openMenu && setOpenMenu("app")}
          >
            {appName}
          </button>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
            onMouseEnter={() => openMenu && setOpenMenu("file")}
          >
            File
          </button>
          {openMenu === "file" && renderMenu(FILE_MENU)}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
            onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
            onMouseEnter={() => openMenu && setOpenMenu("edit")}
          >
            Edit
          </button>
          {openMenu === "edit" && renderMenu(EDIT_MENU)}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
            onClick={() => setOpenMenu(openMenu === "view" ? null : "view")}
            onMouseEnter={() => openMenu && setOpenMenu("view")}
          >
            View
          </button>
          {openMenu === "view" && renderMenu(VIEW_MENU)}
        </div>

        <button
          className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
          onMouseEnter={() => openMenu && setOpenMenu("go")}
        >
          Go
        </button>
        <button
          className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
          onMouseEnter={() => openMenu && setOpenMenu("window")}
        >
          Window
        </button>
        <button
          className="rounded px-2 py-0.5 opacity-90 transition-colors hover:bg-white/10"
          onMouseEnter={() => openMenu && setOpenMenu("help")}
        >
          Help
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button className="rounded p-1 opacity-80 transition-colors hover:bg-white/10">
          <Bluetooth className="h-[13px] w-[13px]" />
        </button>
        <button className="rounded p-1 opacity-80 transition-colors hover:bg-white/10">
          <Volume2 className="h-[13px] w-[13px]" />
        </button>
        <button className="rounded p-1 opacity-80 transition-colors hover:bg-white/10">
          <Wifi className="h-[13px] w-[13px]" />
        </button>
        <button className="rounded p-1 opacity-80 transition-colors hover:bg-white/10">
          <Search className="h-[13px] w-[13px]" />
        </button>

        {/* Control Center Toggle */}
        <div className="relative">
          <button
            className="rounded p-1 opacity-80 transition-colors hover:bg-white/10"
            onClick={() => setShowControlCenter(!showControlCenter)}
          >
            <svg className="h-[13px] w-[13px]" viewBox="0 0 16 16" fill="white">
              <rect x="1" y="1" width="6" height="6" rx="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" />
            </svg>
          </button>

          {showControlCenter && <ControlCenter />}
        </div>

        <button className="rounded p-1 opacity-80 transition-colors hover:bg-white/10">
          <Battery className="h-[14px] w-[14px]" />
        </button>

        <span className="ml-1 cursor-default text-[12px] opacity-80">{date}</span>
        <span className="cursor-default text-[12px] opacity-80">{time}</span>
      </div>
    </div>
  )
}

function ControlCenter() {
  const [wifi, setWifi] = useState(true)
  const [bluetooth, setBluetooth] = useState(true)
  const [airdrop, setAirdrop] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [brightness, setBrightness] = useState(80)
  const [volume, setVolume] = useState(65)
  const [focus, setFocus] = useState(false)

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[320px] p-3 z-[10002]"
      style={{
        background: "rgba(236, 236, 236, 0.88)",
        backdropFilter: "blur(50px) saturate(180%)",
        WebkitBackdropFilter: "blur(50px) saturate(180%)",
        borderRadius: "14px",
        boxShadow: "0 16px 50px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Connectivity */}
        <div className="rounded-xl bg-white/70 p-3 space-y-2.5">
          <button
            className="flex items-center gap-2.5 w-full"
            onClick={() => setWifi(!wifi)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${wifi ? "bg-[#007aff]" : "bg-[#ccc]"}`}>
              <Wifi className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">Wi-Fi</div>
              <div className="text-[10px] text-[#999]">{wifi ? "Home-5G" : "Off"}</div>
            </div>
          </button>
          <button
            className="flex items-center gap-2.5 w-full"
            onClick={() => setBluetooth(!bluetooth)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bluetooth ? "bg-[#007aff]" : "bg-[#ccc]"}`}>
              <Bluetooth className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">Bluetooth</div>
              <div className="text-[10px] text-[#999]">{bluetooth ? "On" : "Off"}</div>
            </div>
          </button>
          <button
            className="flex items-center gap-2.5 w-full"
            onClick={() => setAirdrop(!airdrop)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${airdrop ? "bg-[#007aff]" : "bg-[#ccc]"}`}>
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 18l-4-4h8l-4 4z" />
                <path d="M7.5 11a6.5 6.5 0 0 1 9 0" />
                <path d="M4.5 8a11 11 0 0 1 15 0" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">AirDrop</div>
              <div className="text-[10px] text-[#999]">{airdrop ? "Everyone" : "Off"}</div>
            </div>
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2.5 rounded-xl bg-white/70 p-3"
            onClick={() => setFocus(!focus)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${focus ? "bg-[#5e5ce6]" : "bg-[#ccc]"}`}>
              <Moon className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">Focus</div>
              <div className="text-[10px] text-[#999]">{focus ? "On" : "Off"}</div>
            </div>
          </button>
          <button
            className="flex items-center gap-2.5 rounded-xl bg-white/70 p-3"
            onClick={() => setDarkMode(!darkMode)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? "bg-[#5e5ce6]" : "bg-[#ccc]"}`}>
              {darkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-white" />}
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">
                {darkMode ? "Dark" : "Light"}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/70 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ccc]">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-medium text-[#333]">Screen Mirroring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Display */}
      <div className="rounded-xl bg-white/70 p-3 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Sun className="h-3.5 w-3.5 text-[#999]" />
          <span className="text-[12px] font-medium text-[#333]">Display</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full accent-[#007aff] h-1"
        />
      </div>

      {/* Sound */}
      <div className="rounded-xl bg-white/70 p-3 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-3.5 w-3.5 text-[#999]" />
          <span className="text-[12px] font-medium text-[#333]">Sound</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-[#007aff] h-1"
        />
      </div>

      {/* Now Playing */}
      <div className="rounded-xl bg-white/70 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-[#333]">Not Playing</div>
            <div className="text-[10px] text-[#999]">Music</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-[#666] hover:text-[#333]">
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button className="text-[#666] hover:text-[#333]">
              <Play className="h-4 w-4" />
            </button>
            <button className="text-[#666] hover:text-[#333]">
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
