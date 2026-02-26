import "server-only"

import { headers } from "next/headers"

import { extractSessionUser, toDesktopUser, type DesktopUser } from "@/lib/auth-user"
import { auth } from "@/server/modules/auth/auth.service"

export async function getServerDesktopUser(): Promise<DesktopUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      asResponse: false,
    })

    const authUser = extractSessionUser(session)
    if (!authUser) {
      return null
    }

    return toDesktopUser(authUser)
  } catch {
    return null
  }
}
