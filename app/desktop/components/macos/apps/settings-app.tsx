"use client"

import { useState } from "react"
import {
  Wifi,
  Bluetooth,
  Monitor,
  Volume2,
  Bell,
  Shield,
  Palette,
  Keyboard,
  Mouse,
  Globe,
  User,
  HardDrive,
} from "lucide-react"

interface SettingItem {
  name: string
  icon: React.ReactNode
  color: string
}

const SETTINGS: SettingItem[] = [
  { name: "Wi-Fi", icon: <Wifi className="h-4 w-4 text-white" />, color: "#007aff" },
  { name: "Bluetooth", icon: <Bluetooth className="h-4 w-4 text-white" />, color: "#007aff" },
  { name: "Network", icon: <Globe className="h-4 w-4 text-white" />, color: "#007aff" },
  { name: "Notifications", icon: <Bell className="h-4 w-4 text-white" />, color: "#ff3b30" },
  { name: "Sound", icon: <Volume2 className="h-4 w-4 text-white" />, color: "#ff2d55" },
  { name: "Display", icon: <Monitor className="h-4 w-4 text-white" />, color: "#5856d6" },
  { name: "Appearance", icon: <Palette className="h-4 w-4 text-white" />, color: "#af52de" },
  { name: "Privacy & Security", icon: <Shield className="h-4 w-4 text-white" />, color: "#007aff" },
  { name: "Keyboard", icon: <Keyboard className="h-4 w-4 text-white" />, color: "#636366" },
  { name: "Trackpad", icon: <Mouse className="h-4 w-4 text-white" />, color: "#636366" },
  { name: "Users & Groups", icon: <User className="h-4 w-4 text-white" />, color: "#636366" },
  { name: "Storage", icon: <HardDrive className="h-4 w-4 text-white" />, color: "#636366" },
]

const SETTING_DETAILS: Record<string, { title: string; items: { label: string; value: string; type: "toggle" | "text" | "slider" }[] }> = {
  "Wi-Fi": {
    title: "Wi-Fi",
    items: [
      { label: "Wi-Fi", value: "On", type: "toggle" },
      { label: "Network", value: "Home-5G", type: "text" },
      { label: "Auto-Join", value: "On", type: "toggle" },
      { label: "IP Address", value: "192.168.1.105", type: "text" },
    ],
  },
  Sound: {
    title: "Sound",
    items: [
      { label: "Output Volume", value: "75", type: "slider" },
      { label: "Alert Volume", value: "50", type: "slider" },
      { label: "Output Device", value: "MacBook Pro Speakers", type: "text" },
      { label: "Play sound on startup", value: "On", type: "toggle" },
    ],
  },
  Display: {
    title: "Display",
    items: [
      { label: "Brightness", value: "80", type: "slider" },
      { label: "True Tone", value: "On", type: "toggle" },
      { label: "Night Shift", value: "Off", type: "toggle" },
      { label: "Resolution", value: "Default for display", type: "text" },
    ],
  },
}

export function SettingsApp() {
  const [activeSetting, setActiveSetting] = useState("Wi-Fi")
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    "Wi-Fi": true,
    "Auto-Join": true,
    "Play sound on startup": true,
    "True Tone": true,
    "Night Shift": false,
  })

  const details = SETTING_DETAILS[activeSetting]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className="flex w-52 flex-shrink-0 flex-col gap-0.5 overflow-auto p-2"
        style={{
          background: "rgba(236, 236, 236, 0.6)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-lg p-2 mb-2 hover:bg-black/[0.04] cursor-default">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#333]">User</div>
            <div className="text-[11px] text-[#999]">Apple ID</div>
          </div>
        </div>

        {SETTINGS.map((setting) => (
          <button
            key={setting.name}
            onClick={() => setActiveSetting(setting.name)}
            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
              activeSetting === setting.name
                ? "bg-[#0058d0] text-white"
                : "text-[#333] hover:bg-black/[0.04]"
            }`}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{
                background:
                  activeSetting === setting.name ? "rgba(255,255,255,0.2)" : setting.color,
              }}
            >
              {setting.icon}
            </div>
            {setting.name}
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-auto p-6">
        {details ? (
          <div>
            <h2 className="mb-6 text-[22px] font-semibold text-[#333]">
              {details.title}
            </h2>
            <div className="space-y-4">
              {details.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <span className="text-[14px] text-[#333]">{item.label}</span>
                  {item.type === "toggle" ? (
                    <button
                      onClick={() =>
                        setToggleStates((prev) => ({
                          ...prev,
                          [item.label]: !prev[item.label],
                        }))
                      }
                      className="relative h-6 w-10 rounded-full transition-colors"
                      style={{
                        background: toggleStates[item.label] ? "#34c759" : "#e5e5ea",
                      }}
                      aria-label={`Toggle ${item.label}`}
                    >
                      <div
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                        style={{
                          transform: toggleStates[item.label]
                            ? "translateX(18px)"
                            : "translateX(2px)",
                        }}
                      />
                    </button>
                  ) : item.type === "slider" ? (
                    <div className="flex w-48 items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue={item.value}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  ) : (
                    <span className="text-[14px] text-[#999]">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-[22px] font-semibold text-[#333]">
              {activeSetting}
            </h2>
            <div className="rounded-lg bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[14px] text-[#999]">
                Settings for {activeSetting} will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
