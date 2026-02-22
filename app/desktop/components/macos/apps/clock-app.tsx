"use client"

import { useState, useEffect, useRef } from "react"

const WORLD_CLOCKS = [
  { city: "San Francisco", offset: -8, label: "PST" },
  { city: "New York", offset: -5, label: "EST" },
  { city: "London", offset: 0, label: "GMT" },
  { city: "Tokyo", offset: 9, label: "JST" },
  { city: "Sydney", offset: 11, label: "AEDT" },
]

export function ClockApp() {
  const [now, setNow] = useState(new Date())
  const [activeTab, setActiveTab] = useState<"world" | "analog" | "stopwatch">("analog")
  const [swRunning, setSwRunning] = useState(false)
  const [swTime, setSwTime] = useState(0)
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (swRunning) {
      swRef.current = setInterval(() => setSwTime((t) => t + 10), 10)
    } else if (swRef.current) {
      clearInterval(swRef.current)
    }
    return () => { if (swRef.current) clearInterval(swRef.current) }
  }, [swRunning])

  const formatSw = (ms: number) => {
    const min = Math.floor(ms / 60000)
    const sec = Math.floor((ms % 60000) / 1000)
    const cent = Math.floor((ms % 1000) / 10)
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cent).padStart(2, "0")}`
  }

  const tabs = [
    { id: "world" as const, label: "World Clock" },
    { id: "analog" as const, label: "Clock" },
    { id: "stopwatch" as const, label: "Stopwatch" },
  ]

  const sec = now.getSeconds()
  const min = now.getMinutes()
  const hr = now.getHours() % 12

  const secAngle = sec * 6
  const minAngle = min * 6 + sec * 0.1
  const hrAngle = hr * 30 + min * 0.5

  return (
    <div className="flex h-full flex-col" style={{ background: "#fff" }}>
      {/* Tab Bar */}
      <div className="flex items-center justify-center gap-1 px-4 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#007aff] text-white"
                : "text-[#666] hover:bg-black/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-auto p-4">
        {activeTab === "analog" && (
          <>
            {/* Analog Clock */}
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {/* Clock face */}
                <circle cx="100" cy="100" r="96" fill="white" stroke="#e5e5ea" strokeWidth="1" />
                {/* Hour markers */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180)
                  const x1 = 100 + 82 * Math.cos(angle)
                  const y1 = 100 + 82 * Math.sin(angle)
                  const x2 = 100 + 90 * Math.cos(angle)
                  const y2 = 100 + 90 * Math.sin(angle)
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="2" strokeLinecap="round" />
                })}
                {/* Minute markers */}
                {Array.from({ length: 60 }).map((_, i) => {
                  if (i % 5 === 0) return null
                  const angle = (i * 6 - 90) * (Math.PI / 180)
                  const x1 = 100 + 86 * Math.cos(angle)
                  const y1 = 100 + 86 * Math.sin(angle)
                  const x2 = 100 + 90 * Math.cos(angle)
                  const y2 = 100 + 90 * Math.sin(angle)
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth="0.8" strokeLinecap="round" />
                })}
                {/* Hour numbers */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180)
                  const cx = 100 + 72 * Math.cos(angle)
                  const cy = 100 + 72 * Math.sin(angle)
                  return (
                    <text key={num} x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="#333">
                      {num}
                    </text>
                  )
                })}
                {/* Hour hand */}
                <line
                  x1="100" y1="100"
                  x2={100 + 50 * Math.cos((hrAngle - 90) * (Math.PI / 180))}
                  y2={100 + 50 * Math.sin((hrAngle - 90) * (Math.PI / 180))}
                  stroke="#333" strokeWidth="4" strokeLinecap="round"
                />
                {/* Minute hand */}
                <line
                  x1="100" y1="100"
                  x2={100 + 68 * Math.cos((minAngle - 90) * (Math.PI / 180))}
                  y2={100 + 68 * Math.sin((minAngle - 90) * (Math.PI / 180))}
                  stroke="#333" strokeWidth="2.5" strokeLinecap="round"
                />
                {/* Second hand */}
                <line
                  x1={100 - 15 * Math.cos((secAngle - 90) * (Math.PI / 180))}
                  y1={100 - 15 * Math.sin((secAngle - 90) * (Math.PI / 180))}
                  x2={100 + 76 * Math.cos((secAngle - 90) * (Math.PI / 180))}
                  y2={100 + 76 * Math.sin((secAngle - 90) * (Math.PI / 180))}
                  stroke="#ff3b30" strokeWidth="1" strokeLinecap="round"
                />
                {/* Center dot */}
                <circle cx="100" cy="100" r="4" fill="#333" />
                <circle cx="100" cy="100" r="2" fill="#ff3b30" />
              </svg>
            </div>
            <div className="mt-4 text-[28px] font-light text-[#333] tabular-nums">
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
            </div>
            <div className="text-[13px] text-[#999] mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          </>
        )}

        {activeTab === "world" && (
          <div className="w-full max-w-sm space-y-2">
            {WORLD_CLOCKS.map((clock) => {
              const utc = now.getTime() + now.getTimezoneOffset() * 60000
              const cityTime = new Date(utc + clock.offset * 3600000)
              const cityHr = cityTime.getHours()
              const isDaytime = cityHr >= 6 && cityHr < 18
              return (
                <div
                  key={clock.city}
                  className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: isDaytime ? "#f8f8f8" : "#2a2a2e", border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <div>
                    <div className={`text-[14px] font-medium ${isDaytime ? "text-[#333]" : "text-white"}`}>
                      {clock.city}
                    </div>
                    <div className={`text-[11px] ${isDaytime ? "text-[#999]" : "text-white/50"}`}>
                      {clock.label}
                    </div>
                  </div>
                  <div className={`text-[24px] font-light tabular-nums ${isDaytime ? "text-[#333]" : "text-white"}`}>
                    {cityTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "stopwatch" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-[48px] font-light text-[#333] tabular-nums tracking-tight">
              {formatSw(swTime)}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSwRunning(false); setSwTime(0) }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e5e5ea] text-[14px] font-medium text-[#333] hover:bg-[#d5d5da]"
              >
                Reset
              </button>
              <button
                onClick={() => setSwRunning(!swRunning)}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-[14px] font-medium text-white ${
                  swRunning ? "bg-[#ff3b30] hover:bg-[#dd3328]" : "bg-[#34c759] hover:bg-[#2db550]"
                }`}
              >
                {swRunning ? "Stop" : "Start"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
