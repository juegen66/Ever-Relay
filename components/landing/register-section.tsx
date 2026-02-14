"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Check, AlertCircle, User, Mail, Lock } from "lucide-react"
import { registerUser } from "@/lib/auth-store"

export function RegisterSection() {
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const validate = (): string | null => {
    if (!form.username.trim()) return "Please enter a username"
    if (form.username.length < 2) return "Username must be at least 2 characters"
    if (form.username.length > 20) return "Username must be 20 characters or less"
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return "Username can only contain letters, numbers and underscores"
    if (!form.email.trim()) return "Please enter your email"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email"
    if (!form.password) return "Please enter a password"
    if (form.password.length < 6) return "Password must be at least 6 characters"
    if (form.password !== form.confirmPassword) return "Passwords do not match"
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
    // Simulate a brief loading state
    setTimeout(() => {
      const result = registerUser(form.username, form.email, form.password)
      if (!result.success) {
        setError(result.error || "Registration failed")
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
      // Redirect to desktop after short delay
      setTimeout(() => router.push("/desktop"), 1500)
    }, 800)
  }

  const inputBase =
    "w-full rounded-xl border bg-white/[0.04] px-4 py-3 pl-11 text-[14px] text-white outline-none transition-all placeholder:text-white/25 focus:bg-white/[0.06]"
  const inputNormal = `${inputBase} border-white/[0.08] focus:border-[#007aff]/50 focus:ring-1 focus:ring-[#007aff]/20`
  const inputError = `${inputBase} border-red-500/40 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20`

  return (
    <section id="register" className="relative px-6 py-24" ref={sectionRef}>
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] animate-glow-pulse"
        style={{ background: "radial-gradient(ellipse, rgba(0,122,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-md">
        <div className={`text-center mb-10 ${visible ? "reveal-on-scroll" : "opacity-0"}`}>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Create Your Account
          </h2>
          <p className="mt-3 text-[15px] text-white/40">
            Sign up and access your cloud desktop instantly.
          </p>
        </div>

        {success ? (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border border-[#30d158]/20 bg-[#30d158]/[0.06] p-8 text-center reveal-on-scroll"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#30d158]/20">
              <Check className="h-7 w-7 text-[#30d158]" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-white">Account Created</h3>
              <p className="mt-1 text-[14px] text-white/50">Redirecting to your desktop...</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 ${visible ? "reveal-on-scroll" : "opacity-0"}`}
            style={{ animationDelay: "0.15s" }}
          >
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3 text-[13px] text-red-400 animate-shake">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Username */}
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); setError("") }}
                className={error && !form.username ? inputError : inputNormal}
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setError("") }}
                className={error && !form.email ? inputError : inputNormal}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setError("") }}
                className={error && !form.password ? inputError : inputNormal}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setError("") }}
                className={error && form.password !== form.confirmPassword ? inputError : inputNormal}
                autoComplete="new-password"
              />
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => {
                  const strength =
                    form.password.length >= 12 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4
                    : form.password.length >= 8 && /[A-Z]/.test(form.password) ? 3
                    : form.password.length >= 6 ? 2
                    : 1
                  const active = level <= strength
                  const color = strength <= 1 ? "bg-red-500" : strength === 2 ? "bg-orange-500" : strength === 3 ? "bg-yellow-500" : "bg-[#30d158]"
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${active ? color : "bg-white/[0.06]"}`}
                    />
                  )
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#007aff] py-3 text-[15px] font-medium text-white transition-all hover:bg-[#0066d6] disabled:opacity-50 disabled:cursor-not-allowed"
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
                "Create Account"
              )}
            </button>

            <p className="text-center text-[13px] text-white/30">
              Already have an account?{" "}
              <a href="/desktop" className="text-[#007aff] hover:underline">
                Sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
