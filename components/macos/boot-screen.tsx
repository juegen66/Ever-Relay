"use client"

import { useState, useEffect } from "react"
import { Apple } from "lucide-react"

export function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"boot" | "login" | "logging-in">("boot")
  const [progress, setProgress] = useState(0)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [time, setTime] = useState("")

  useEffect(() => {
    const now = new Date()
    setTime(
      now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    )
  }, [])

  useEffect(() => {
    if (phase === "boot") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setPhase("login"), 300)
            return 100
          }
          return prev + Math.random() * 8 + 2
        })
      }, 80)
      return () => clearInterval(interval)
    }
  }, [phase])

  useEffect(() => {
    if (phase === "login") {
      setTimeout(() => setShowPassword(true), 500)
    }
  }, [phase])

  useEffect(() => {
    if (phase === "logging-in") {
      setTimeout(onComplete, 1500)
    }
  }, [phase, onComplete])

  const handleLogin = () => {
    setPhase("logging-in")
  }

  if (phase === "boot") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
        <Apple className="mb-8 h-16 w-16 fill-white text-white" />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      style={{
        backgroundImage: "url(/images/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(60px) brightness(0.7)",
          WebkitBackdropFilter: "blur(60px) brightness(0.7)",
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: phase === "logging-in" ? 0 : 1,
          transform: phase === "logging-in" ? "scale(1.1)" : "scale(1)",
          transition: "all 0.8s ease-in-out",
        }}
      >
        <div className="mb-8 text-[64px] font-light text-white tracking-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
          {time}
        </div>
        <div className="mb-2 text-[13px] text-white/60">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>

        {/* User Avatar */}
        <div className="mb-3 mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-black/30">
          <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="mb-4 text-[17px] font-medium text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>
          User
        </div>

        {/* Password Field */}
        <div
          style={{
            opacity: showPassword ? 1 : 0,
            transform: showPassword ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s ease-out",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              autoFocus
              className="h-8 w-48 rounded-full border border-white/30 bg-white/15 px-4 text-center text-[13px] text-white outline-none placeholder:text-white/50 focus:border-white/50 focus:bg-white/20"
              style={{
                backdropFilter: "blur(20px)",
              }}
            />
          </form>
          <div className="mt-3 text-center text-[11px] text-white/40">
            Press Enter or click to log in
          </div>
          <button
            onClick={handleLogin}
            className="mt-2 flex w-full items-center justify-center"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30">
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
