"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Apple } from "lucide-react"
import { getUsers, loginUser, getCurrentUser, registerUser, type User } from "@/lib/auth-store"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

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
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [error, setError] = useState("")
  const [shaking, setShaking] = useState(false)
  const [time, setTime] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)

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
      setTimeout(() => setShowPasswordField(true), 500)
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

  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    setTimeout(() => {
      const allUsers = getUsers()
      const googleUser = allUsers.find(u => u.email === "user@gmail.com")
      if (googleUser) {
        setPhase("logging-in")
        setTimeout(() => {
          onComplete(googleUser)
        }, 1200)
        return
      }
      const gUsername = "Google_" + Math.floor(Math.random() * 10000)
      const gPassword = "google_oauth_" + Date.now()
      const result = registerUser(gUsername, "user@gmail.com", gPassword)
      if (result.success && result.user) {
        setPhase("logging-in")
        setTimeout(() => {
          onComplete(result.user!)
        }, 1200)
      } else {
        setError("Google sign in failed. Please try again.")
        setGoogleLoading(false)
      }
    }, 800)
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
              Please register on our website first, or sign in quickly with Google.
            </p>

            {/* Google login for no-user state */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="mb-3 flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-white/25 border border-white/20 disabled:opacity-50"
              style={{ backdropFilter: "blur(20px)" }}
            >
              <GoogleIcon className="h-4 w-4" />
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </button>

            <button
              onClick={() => router.push("/register")}
              className="rounded-full bg-white/10 px-6 py-2 text-[13px] font-medium text-white/70 transition-all hover:bg-white/20 border border-white/15"
              style={{ backdropFilter: "blur(20px)" }}
            >
              Go to Register
            </button>

            {/* Skip login for testing */}
            <button
              onClick={() => {
                const testUser: User = {
                  username: "Guest",
                  email: "guest@cloudos.app",
                  passwordHash: "",
                  avatar: "from-blue-500 to-cyan-500",
                  createdAt: new Date().toISOString(),
                }
                setPhase("logging-in")
                setTimeout(() => onComplete(testUser), 600)
              }}
              className="mt-3 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white/70 transition-all hover:bg-white/25 hover:text-white"
              style={{ backdropFilter: "blur(20px)" }}
            >
              Skip Login (Test)
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

            {/* Google login below user avatars */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="mb-1 flex items-center gap-3">
                <div className="h-px w-16 bg-white/15" />
                <span className="text-[11px] text-white/30">or</span>
                <div className="h-px w-16 bg-white/15" />
              </div>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-medium text-white/70 transition-all hover:bg-white/20 border border-white/15 disabled:opacity-50"
                style={{ backdropFilter: "blur(20px)" }}
              >
                <GoogleIcon className="h-3.5 w-3.5" />
                {googleLoading ? "Signing in..." : "Sign in with Google"}
              </button>
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
                opacity: showPasswordField ? 1 : 0,
                transform: showPasswordField ? "translateY(0)" : "translateY(10px)",
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
                  Press Enter to sign in
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

              {/* Google login + homepage link */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white/60 transition-all hover:bg-white/20 border border-white/15 disabled:opacity-50"
                  style={{ backdropFilter: "blur(20px)" }}
                >
                  <GoogleIcon className="h-3 w-3" />
                  {googleLoading ? "Signing in..." : "Sign in with Google"}
                </button>
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
