import { auth, ensureAuthMigrations } from "@/server/modules/auth/auth.service"

export async function handleAuthRequest(request: Request) {
  await ensureAuthMigrations()
  return auth.handler(request)
}
