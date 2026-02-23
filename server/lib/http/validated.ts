import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"

import type { ServerBindings } from "@/server/types"

function getValidated<T>(
  context: Context<ServerBindings>,
  key: "validatedParams" | "validatedQuery" | "validatedBody",
  source: "params" | "query" | "body"
) {
  const value = context.get(key)
  if (value === undefined) {
    throw new HTTPException(500, {
      message: `Missing validated ${source}`,
    })
  }

  return value as T
}

export function getValidatedParams<T>(context: Context<ServerBindings>) {
  return getValidated<T>(context, "validatedParams", "params")
}

export function getValidatedQuery<T>(context: Context<ServerBindings>) {
  return getValidated<T>(context, "validatedQuery", "query")
}

export function getValidatedBody<T>(context: Context<ServerBindings>) {
  return getValidated<T>(context, "validatedBody", "body")
}
