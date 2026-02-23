import type { Context } from "hono"

import type { ServerBindings } from "@/server/types"

interface OkOptions {
  message?: string
  status?: number
}

export function ok<TData>(
  context: Context<ServerBindings>,
  data: TData,
  options: OkOptions = {}
) {
  if (options.status !== undefined) {
    context.status(options.status as never)
  }

  const requestId = context.get("requestId")
  const payload = {
    success: true as const,
    code: 0 as const,
    requestId,
    data,
  }

  if (options.message) {
    return context.json({
      ...payload,
      message: options.message,
    })
  }

  return context.json(payload)
}

export function fail<TData = unknown>(
  context: Context<ServerBindings>,
  status: number,
  message: string,
  data?: TData
) {
  context.status(status as never)

  const requestId = context.get("requestId")
  const payload = {
    success: false as const,
    code: status,
    message,
    requestId,
  }

  if (data !== undefined) {
    return context.json({
      ...payload,
      data,
    })
  }

  return context.json(payload)
}
