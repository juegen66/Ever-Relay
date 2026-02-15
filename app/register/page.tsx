"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Check, Monitor } from "lucide-react"
import { registerUser } from "@/lib/auth-store"

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

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!form.username.trim()) return "Please enter a username"
    if (form.username.length < 2) return "Username must be at least 2 characters"
    if (form.username.length > 20) return "Username cannot exceed 20 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return "Username can only contain letters, numbers, and underscores"
    if (!form.email.trim()) return "Please enter an email address"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address"
    if (!form.password) return "Please enter a password"
    if (form.password.length < 6) return "Password must be at least 6 characters"
    if (form.password !== form.confirmPassword) return "The passwords you typed do not match"
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setTimeout(() => {
      const result = registerUser(form.username, form.email, form.password)
      if (!result.success) {
        setError(result.error || "Registration failed")
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push("/desktop"), 1200)
    }, 600)
  }

  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value })
    setError("")
  }

  const handleGoogleSignUp = () => {
    setLoading(true)
    setTimeout(() => {
      const gUsername = "google_user_" + Math.floor(Math.random() * 10000)
      const result = registerUser(gUsername, "user@gmail.com", "google_oauth_" + Date.now())
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push("/desktop"), 1200)
      } else {
        setError("This Google account is already registered. Please sign in instead.")
        setLoading(false)
      }
    }, 800)
  }

  const strengthLevel = (() => {
    const p = form.password
    if (!p) return 0
    if (p.length >= 12 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) return 4
    if (p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 3
    if (p.length >= 6) return 2
    return 1
  })()

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthLevel]

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="hidden w-[45%] flex-col items-center justify-center bg-[#f0ece4] lg:flex">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34c759] shadow-lg shadow-[#34c759]/20">
            <Monitor className="h-6 w-6 text-white" />
          </div>
          <span className="text-[28px] font-bold tracking-tight text-[#1a1a2e]">
            Cloud<span className="text-[#34c759]">OS</span>
          </span>
        </Link>
        <p className="mt-4 text-[14px] text-[#8a8680]">Your desktop in the cloud.</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile logo bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34c759]">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <span className="text-[16px] font-bold text-[#1a1a2e]">
              Cloud<span className="text-[#34c759]">OS</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[440px]">
            {/* Title */}
            <h1 className="text-center text-[32px] font-bold leading-tight tracking-tight text-[#1a1a2e] md:text-[40px]">
              Register for<br />CloudOS
            </h1>

            {success ? (
              <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#34c759]/20 bg-[#34c759]/[0.04] p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10">
                  <Check className="h-7 w-7 text-[#34c759]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#1a1a2e]">Account created successfully</h3>
                  <p className="mt-1 text-[14px] text-[#8a8680]">Redirecting to your desktop...</p>
                </div>
              </div>
            ) : (
              <div className="mt-10">
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e0dcd6] bg-white py-3.5 text-[15px] font-medium text-[#1a1a2e] transition-all hover:bg-[#faf8f5] hover:border-[#d0ccc6] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Sign up with Google
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#e8e4de]" />
                  <span className="text-[13px] text-[#b0aca4]">or</span>
                  <div className="h-px flex-1 bg-[#e8e4de]" />
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 animate-shake">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label className="mb-1.5 block text-[14px] font-medium text-[#1a1a2e]">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="your_username"
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      className="w-full rounded-xl border border-[#e0dcd6] bg-white px-4 py-3 text-[14px] text-[#1a1a2e] outline-none transition-all placeholder:text-[#c5c0b8] focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/10"
                      autoComplete="username"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-[14px] font-medium text-[#1a1a2e]">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full rounded-xl border border-[#e0dcd6] bg-white px-4 py-3 text-[14px] text-[#1a1a2e] outline-none transition-all placeholder:text-[#c5c0b8] focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/10"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-[14px] font-medium text-[#1a1a2e]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="w-full rounded-xl border border-[#e0dcd6] bg-white px-4 py-3 pr-11 text-[14px] text-[#1a1a2e] outline-none transition-all placeholder:text-[#c5c0b8] focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c5c0b8] hover:text-[#8a8680] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-1.5 block text-[14px] font-medium text-[#1a1a2e]">
                      Confirm password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      className="w-full rounded-xl border border-[#e0dcd6] bg-white px-4 py-3 text-[14px] text-[#1a1a2e] outline-none transition-all placeholder:text-[#c5c0b8] focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/10"
                      autoComplete="new-password"
                    />
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="mt-1.5 text-right text-[12px] text-red-500">
                        The new passwords you typed do not match.
                      </p>
                    )}
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1.5">
                        {[1, 2, 3, 4].map((level) => {
                          const active = level <= strengthLevel
                          const color = strengthLevel <= 1 ? "bg-red-400" : strengthLevel === 2 ? "bg-orange-400" : strengthLevel === 3 ? "bg-yellow-400" : "bg-[#34c759]"
                          return (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all ${active ? color : "bg-[#e8e4de]"}`}
                            />
                          )
                        })}
                      </div>
                      <span className="text-[11px] text-[#b0aca4]">{strengthLabel}</span>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#34c759] py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#2fb84e] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      "Register"
                    )}
                  </button>

                  {/* Log in Button */}
                  <Link
                    href="/desktop"
                    className="flex w-full items-center justify-center rounded-xl border border-[#34c759] py-3.5 text-[15px] font-semibold text-[#34c759] transition-all hover:bg-[#34c759]/[0.04] active:scale-[0.99]"
                  >
                    Log in
                  </Link>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0ece4] px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#34c759]">
              <Monitor className="h-3 w-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-[#8a8680]">CloudOS</span>
          </Link>
          <p className="text-[11px] text-[#c5c0b8]">Not affiliated with Apple Inc.</p>
        </div>
      </div>
    </div>
  )
}
