export interface DesktopUser {
  id: string
  email: string
  username: string
  image?: string | null
}

type MaybeAuthUser = {
  id?: unknown
  email?: unknown
  name?: unknown
  username?: unknown
  image?: unknown
}

function hasRequiredUserFields(user: MaybeAuthUser): user is MaybeAuthUser & { id: string; email: string } {
  return (
    typeof user.id === "string" &&
    user.id.trim().length > 0 &&
    typeof user.email === "string" &&
    user.email.trim().length > 0
  )
}

export function extractSessionUser(payload: unknown): MaybeAuthUser | null {
  if (!payload || typeof payload !== "object") return null

  const record = payload as Record<string, unknown>

  let candidate: MaybeAuthUser | null = null

  if ("email" in record || "name" in record || "id" in record) {
    candidate = record as MaybeAuthUser
  }

  if (!candidate && record.user && typeof record.user === "object") {
    candidate = record.user as MaybeAuthUser
  }

  if (!candidate || !hasRequiredUserFields(candidate)) {
    return null
  }

  return candidate
}

export function toDesktopUser(user: MaybeAuthUser): DesktopUser {
  if (!hasRequiredUserFields(user)) {
    throw new Error("Invalid authenticated user payload")
  }

  const id = user.id.trim()
  const email = user.email.trim()
  const fallbackName = email.split("@")[0] || "User"
  const name =
    typeof user.name === "string" && user.name.trim()
      ? user.name.trim()
      : typeof user.username === "string" && user.username.trim()
        ? user.username.trim()
        : fallbackName

  return {
    id,
    email,
    username: name,
    image: typeof user.image === "string" ? user.image : null,
  }
}
