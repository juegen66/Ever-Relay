import type { MiddlewareHandler } from "hono"

import { auth } from "@/server/modules/auth/auth.service"
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
      const requestId = context.get("requestId")
      return context.json(
        {
          success: false,
          code: 401,
          message: "Unauthorized",
          requestId,
        },
        401
      )
    }

    context.set("user", session.user)
    context.set("session", session.session)
    await next()
  } catch {
    const requestId = context.get("requestId")
    return context.json(
      {
        success: false,
        code: 401,
        message: "Unauthorized",
        requestId,
      },
      401
    )
  }
}
