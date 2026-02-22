import { createAuthClient } from "better-auth/client"
import { adminClient, emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [adminClient(), emailOTPClient()],
})

export const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Authentication failed"
) {
  if (!error || typeof error !== "object") return fallback

  const maybeError = error as {
    message?: unknown
    statusText?: unknown
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim()) {
    return maybeError.message
  }

  if (typeof maybeError.statusText === "string" && maybeError.statusText.trim()) {
    return maybeError.statusText
  }

  return fallback
}

