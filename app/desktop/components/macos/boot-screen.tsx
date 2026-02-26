"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Apple } from "lucide-react"
import {
  authClient,
  GOOGLE_AUTH_ENABLED,
  getAuthErrorMessage,
} from "@/lib/auth/auth-client"
import {
  extractSessionUser,
  toDesktopUser,
  type DesktopUser,
} from "@/lib/auth-user"

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

type BootPhase = "boot" | "login" | "logging-in"

interface BootScreenProps {
  onComplete: (user: DesktopUser) => void
  callbackURL?: string
}

export function BootScreen({ onComplete, callbackURL = "/desktop" }: BootScreenProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<BootPhase>("boot")
  const [progress, setProgress] = useState(0)
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [error, setError] = useState("")
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const completeLogin = useCallback(
    (payload: unknown) => {
      const authUser = extractSessionUser(payload)
      if (!authUser) return false

      setPhase("logging-in")
      const desktopUser = toDesktopUser(authUser)
      setTimeout(() => {
        onComplete(desktopUser)
      }, 900)
      return true
    },
    [onComplete]
  )

  const restoreSession = useCallback(async () => {
    try {
      const { data, error: sessionError } = await authClient.getSession()
      if (sessionError) return false
      return completeLogin(data)
    } catch {
      return false
    }
  }, [completeLogin])

  useEffect(() => {
    const updateClock = () => {
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
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      )
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phase !== "boot") return

    let currentProgress = 0
    let finished = false

    const interval = setInterval(() => {
      if (finished) return

      currentProgress = Math.min(100, currentProgress + Math.random() * 8 + 2)
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        finished = true
        clearInterval(interval)

        void (async () => {
          const restored = await restoreSession()
          if (!restored) {
            setPhase("login")
          }
        })()
      }
    }, 80)

    return () => clearInterval(interval)
  }, [phase, restoreSession])

  useEffect(() => {
    if (phase === "login") {
      const timer = setTimeout(() => setShowPasswordField(true), 220)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const showLoginError = (message: string) => {
    setError(message)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      showLoginError("Please enter email and password")
      return
    }

    setLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
        rememberMe: true,
        callbackURL,
      })

      if (signInError) {
        showLoginError(getAuthErrorMessage(signInError, "Login failed"))
        return
      }

      const restored = await restoreSession()
      if (!restored) {
        showLoginError("Unable to read session after sign in")
      }
    } catch (err) {
      showLoginError(getAuthErrorMessage(err, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")

    if (!GOOGLE_AUTH_ENABLED) {
      showLoginError("Google sign in is not configured in this environment.")
      return
    }

    setGoogleLoading(true)
    try {
      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      })

      if (socialError) {
        showLoginError(getAuthErrorMessage(socialError, "Google sign in failed"))
      }
    } catch (err) {
      showLoginError(getAuthErrorMessage(err, "Google sign in failed"))
    } finally {
      setGoogleLoading(false)
    }
  }

  if (phase === "boot") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black">
        <Apple className="mb-8 h-16 w-16 fill-white text-white" />
        <div className="progress-glow h-1 w-48 overflow-hidden rounded-full bg-white/20">
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
          backdropFilter: "blur(60px) brightness(0.72)",
          WebkitBackdropFilter: "blur(60px) brightness(0.72)",
        }}
      />

      <div
        className="relative z-10 flex w-[320px] flex-col items-center"
        style={{
          opacity: phase === "logging-in" ? 0 : 1,
          transform: phase === "logging-in" ? "scale(1.08)" : "scale(1)",
          transition: "all 0.8s ease-in-out",
        }}
      >
        <div
          className="mb-2 text-[64px] font-light tracking-tight text-white animate-fade-up"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
        >
          {time}
        </div>
        <div className="mb-8 text-[13px] text-white/60">{date}</div>

        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <svg className="h-10 w-10 text-white/50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <div className="mb-5 text-[17px] font-medium text-white">CloudOS Account</div>

        <form
          onSubmit={handleEmailLogin}
          className="flex w-full flex-col items-center"
          style={{
            opacity: showPasswordField ? 1 : 0,
            transform: showPasswordField ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.45s ease-out",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
            }}
            placeholder="Email"
            autoComplete="email"
            className="mb-2 h-8 w-64 rounded-full border border-white/30 bg-white/15 px-4 text-center text-[13px] text-white outline-none placeholder:text-white/50 focus:bg-white/20"
            style={{ backdropFilter: "blur(20px)" }}
          />

          <div className={shaking ? "animate-shake" : ""}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="Password"
              autoComplete="current-password"
              className="h-8 w-64 rounded-full border bg-white/15 px-4 text-center text-[13px] text-white outline-none placeholder:text-white/50 focus:bg-white/20"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-8 min-w-[140px] items-center justify-center rounded-full border border-white/20 bg-white/20 px-4 text-[12px] font-medium text-white transition-all hover:bg-white/30 disabled:opacity-50"
            style={{ backdropFilter: "blur(20px)" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || !GOOGLE_AUTH_ENABLED}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white/70 transition-all hover:bg-white/20 disabled:opacity-50"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <GoogleIcon className="h-3 w-3" />
            {googleLoading ? "Redirecting..." : "Sign in with Google"}
          </button>
          {!GOOGLE_AUTH_ENABLED && (
            <p className="text-[11px] text-white/35">Google login is disabled.</p>
          )}
          <button
            onClick={() => router.push("/register")}
            className="text-[11px] text-white/45 transition-colors hover:text-white/70"
          >
            Create account
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
  )
}
