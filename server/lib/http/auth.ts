import { HTTPException } from "hono/http-exception"
import type { Context } from "hono"

import type { ServerBindings } from "@/server/types"

export function requireUserId(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    })
  }

  return user.id
}

