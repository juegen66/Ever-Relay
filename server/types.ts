import type { auth } from "@/server/modules/auth/auth.service"

type AuthSession = typeof auth.$Infer.Session
type AuthUser = AuthSession["user"]
type AuthSessionData = AuthSession["session"]

export type ServerBindings = {
  Variables: {
    requestId: string
    user?: AuthUser
    session?: AuthSessionData
  }
}
