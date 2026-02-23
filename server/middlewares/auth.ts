import type { MiddlewareHandler } from "hono"

import { auth } from "@/server/modules/auth/auth.service"
import { fail } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"

export const authMiddleware: MiddlewareHandler<ServerBindings> = async (
  context,
  next
) => {
  try {
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
      asResponse: false,
    })

    if (!session?.user) {
      return fail(context, 401, "Unauthorized")
    }

    context.set("user", session.user)
    context.set("session", session.session)
    await next()
  } catch {
    return fail(context, 401, "Unauthorized")
  }
}
