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

export function extractSessionUser(payload: unknown): MaybeAuthUser | null {
  if (!payload || typeof payload !== "object") return null

  const record = payload as Record<string, unknown>

  if ("email" in record || "name" in record || "id" in record) {
    return record as MaybeAuthUser
  }

  if (record.user && typeof record.user === "object") {
    return record.user as MaybeAuthUser
  }

  return null
}

export function toDesktopUser(user: MaybeAuthUser): DesktopUser {
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim()
      : "user@cloudos.app"

  const fallbackName = email.split("@")[0] || "User"
  const name =
    typeof user.name === "string" && user.name.trim()
      ? user.name.trim()
      : typeof user.username === "string" && user.username.trim()
        ? user.username.trim()
        : fallbackName

  return {
    id:
      typeof user.id === "string" && user.id.trim()
        ? user.id
        : `anon-${email}`,
    email,
    username: name,
    image: typeof user.image === "string" ? user.image : null,
  }
}
