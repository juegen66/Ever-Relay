const DEFAULT_CALLBACK_URL = "/desktop"

export function normalizeCallbackURL(
  callbackURL?: string | null,
  fallback = DEFAULT_CALLBACK_URL
) {
  if (!callbackURL) {
    return fallback
  }

  const normalized = callbackURL.trim()
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback
  }

  if (normalized === "/login" || normalized.startsWith("/login?")) {
    return fallback
  }

  return normalized
}
