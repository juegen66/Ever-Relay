"use client"

import { useState, useEffect, useCallback } from "react"

import { Eye, EyeOff, AlertCircle, Check, Monitor, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  authClient,
  GOOGLE_AUTH_ENABLED,
  getAuthErrorMessage,
} from "@/lib/auth/auth-client"

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
  const [step, setStep] = useState<"form" | "otp">("form")
  const [otp, setOtp] = useState("")
  const [otpEmail, setOtpEmail] = useState("")
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const startCountdown = useCallback(() => setCountdown(60), [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const email = form.email.trim().toLowerCase()
      const { error: authError } = await authClient.signUp.email({
        name: form.username.trim(),
        email,
        password: form.password,
      })

      if (authError) {
        setError(getAuthErrorMessage(authError, "Registration failed"))
        return
      }

      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      })

      if (otpError) {
        setError(getAuthErrorMessage(otpError, "Failed to send verification code"))
        return
      }

      setOtpEmail(email)
      setStep("otp")
      startCountdown()
    } catch (err) {
      setError(getAuthErrorMessage(err, "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email: otpEmail,
        otp,
      })

      if (verifyError) {
        setError(getAuthErrorMessage(verifyError, "Invalid verification code"))
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/desktop"), 1200)
    } catch (err) {
      setError(getAuthErrorMessage(err, "Verification failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError("")
    setLoading(true)
    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: otpEmail,
        type: "email-verification",
      })

      if (otpError) {
        setError(getAuthErrorMessage(otpError, "Failed to resend verification code"))
        return
      }

      startCountdown()
    } catch (err) {
      setError(getAuthErrorMessage(err, "Failed to resend verification code"))
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value })
    setError("")
  }

  const handleGoogleSignUp = async () => {
    if (!GOOGLE_AUTH_ENABLED) {
      setError("Google sign in is not configured in this environment.")
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/desktop",
      })

      if (authError) {
        setError(getAuthErrorMessage(authError, "Google sign in failed"))
        return
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "Google sign in failed"))
    } finally {
      setLoading(false)
    }
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
            Ever<span className="text-[#34c759]">Relay</span>
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
              Ever<span className="text-[#34c759]">Relay</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[440px]">
            {/* Title */}
            <h1 className="text-center text-[32px] font-bold leading-tight tracking-tight text-[#1a1a2e] md:text-[40px]">
              Register for<br />EverRelay
            </h1>

            {success ? (
              <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#34c759]/20 bg-[#34c759]/[0.04] p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10">
                  <Check className="h-7 w-7 text-[#34c759]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#1a1a2e]">Account verified successfully</h3>
                  <p className="mt-1 text-[14px] text-[#8a8680]">Redirecting to your desktop...</p>
                </div>
              </div>
            ) : step === "otp" ? (
              <div className="mt-10">
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10">
                    <Mail className="h-7 w-7 text-[#34c759]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1a1a2e]">Check your email</h3>
                    <p className="mt-1 text-[14px] text-[#8a8680]">
                      A 6-digit verification code has been sent to
                    </p>
                    <p className="mt-0.5 text-[14px] font-medium text-[#1a1a2e]">{otpEmail}</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 animate-shake">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center gap-6">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full rounded-xl bg-[#34c759] py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#2fb84e] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify"
                    )}
                  </button>

                  <div className="flex items-center gap-3 text-[13px]">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || countdown > 0}
                      className="font-medium text-[#34c759] transition-colors hover:text-[#2fb84e] disabled:text-[#b0aca4] disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                    </button>
                    <span className="text-[#e0dcd6]">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form")
                        setOtp("")
                        setError("")
                      }}
                      className="flex items-center gap-1 font-medium text-[#8a8680] transition-colors hover:text-[#1a1a2e]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to form
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-10">
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading || !GOOGLE_AUTH_ENABLED}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e0dcd6] bg-white py-3.5 text-[15px] font-medium text-[#1a1a2e] transition-all hover:bg-[#faf8f5] hover:border-[#d0ccc6] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Sign up with Google
                </button>
                {!GOOGLE_AUTH_ENABLED && (
                  <p className="mt-2 text-center text-[12px] text-[#b0aca4]">
                    Google login is currently disabled.
                  </p>
                )}

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
                    href="/login"
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
            <span className="text-[13px] font-semibold text-[#8a8680]">EverRelay</span>
          </Link>
          <p className="text-[11px] text-[#c5c0b8]">Not affiliated with Apple Inc.</p>
        </div>
      </div>
    </div>
  )
}
