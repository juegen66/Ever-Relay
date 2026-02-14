"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Apple } from "lucide-react"
import { getUsers, loginUser, getCurrentUser, type User } from "@/lib/auth-store"

interface BootScreenProps {
  onComplete: (user: User) => void
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<"boot" | "login" | "logging-in">("boot")
  const [progress, setProgress] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [shaking, setShaking] = useState(false)
  const [time, setTime] = useState("")

  useEffect(() => {
    const now = new Date()
    setTime(
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    )
  }, [])

  useEffect(() => {
    // Check if already logged in
    const current = getCurrentUser()
    if (current) {
      setPhase("boot")
      // Auto-login
      const autoLogin = () => {
        onComplete(current)
      }
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(autoLogin, 300)
            return 100
          }
          return prev + Math.random() * 12 + 4
        })
      }, 60)
      return () => clearInterval(interval)
    }

    // Load registered users
    const allUsers = getUsers()
    setUsers(allUsers)

    // Boot animation
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase === "login") {
      setTimeout(() => setShowPassword(true), 500)
    }
  }, [phase])

  const handleLogin = () => {
    if (!selectedUser) return
    setError("")

    const result = loginUser(selectedUser.username, password)
    if (!result.success) {
      setError(result.error || "Login failed")
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    setPhase("logging-in")
    setTimeout(() => {
      if (result.user) onComplete(result.user)
    }, 1200)
  }

  // Boot phase - Apple logo + progress bar
  if (phase === "boot" && !getCurrentUser()) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black overflow-hidden">
        <Apple className="mb-8 h-16 w-16 fill-white text-white" />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20 progress-glow">
          <div
            className="h-full rounded-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  // Auto-login boot (already logged in)
  if (getCurrentUser()) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black overflow-hidden">
        <Apple className="mb-8 h-16 w-16 fill-white text-white" />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20 progress-glow">
          <div
            className="h-full rounded-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  // Login phase
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden"
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
        {/* Clock */}
        <div
          className="mb-6 text-[64px] font-light text-white tracking-tight animate-fade-up"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
        >
          {time}
        </div>
        <div className="mb-8 text-[13px] text-white/60">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>

        {/* No registered users */}
        {users.length === 0 && !selectedUser && (
          <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <svg className="h-10 w-10 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <p className="mb-4 text-[15px] font-medium text-white/60">No accounts found</p>
            <p className="mb-5 text-[13px] text-white/35 max-w-[260px] text-center">
              Create an account on the homepage to get started.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-white/15 px-6 py-2 text-[13px] font-medium text-white transition-all hover:bg-white/25 border border-white/20"
              style={{ backdropFilter: "blur(20px)" }}
            >
              Go to Homepage
            </button>
          </div>
        )}

        {/* User selection (multiple users) */}
        {users.length > 0 && !selectedUser && (
          <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex gap-6">
              {users.map((user) => (
                <button
                  key={user.username}
                  onClick={() => {
                    setSelectedUser(user)
                    setPassword("")
                    setError("")
                  }}
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                >
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg shadow-black/30 transition-all group-hover:shadow-xl group-hover:shadow-black/40 ${user.avatar}`}
                  >
                    <span className="text-2xl font-semibold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className="text-[14px] font-medium text-white"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
                  >
                    {user.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Password entry for selected user */}
        {selectedUser && (
          <div className="flex flex-col items-center">
            {/* Back button if multiple users */}
            {users.length > 1 && (
              <button
                onClick={() => { setSelectedUser(null); setPassword(""); setError("") }}
                className="mb-4 flex items-center gap-1 text-[12px] text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                Back
              </button>
            )}

            {/* Avatar */}
            <div
              className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg shadow-black/30 ${selectedUser.avatar}`}
            >
              <span className="text-2xl font-semibold text-white">
                {selectedUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div
              className="mb-5 text-[17px] font-medium text-white"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
            >
              {selectedUser.username}
            </div>

            {/* Password field */}
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
                className="flex flex-col items-center"
              >
                <div className={shaking ? "animate-shake" : ""}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="Enter Password"
                    autoFocus
                    className="h-8 w-52 rounded-full border bg-white/15 px-4 text-center text-[13px] text-white outline-none placeholder:text-white/50 focus:bg-white/20 transition-colors"
                    style={{
                      backdropFilter: "blur(20px)",
                      borderColor: error ? "rgba(255,59,48,0.5)" : "rgba(255,255,255,0.3)",
                    }}
                  />
                </div>

                {error && (
                  <p className="mt-2 text-[12px] text-[#ff453a]" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    {error}
                  </p>
                )}

                <div className="mt-3 text-center text-[11px] text-white/40">
                  Press Enter to log in
                </div>

                <button
                  type="submit"
                  className="mt-2 flex items-center justify-center"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </div>
                </button>
              </form>

              {/* Link to homepage */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-[11px] text-white/30 transition-colors hover:text-white/60"
                >
                  Back to Homepage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
