import type { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { z, type ZodTypeAny } from "zod"

import type { ServerBindings } from "@/server/types"

type ValidationSource = "params" | "query" | "body"

function formatZodError(error: z.ZodError) {
  const [issue] = error.issues
  if (!issue) {
    return "Invalid request payload"
  }

  if (issue.path.length === 0) {
    return issue.message
  }

  return `${issue.path.join(".")}: ${issue.message}`
}

function parseValue<TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  source: ValidationSource
) {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new HTTPException(400, {
      message: `Invalid ${source}: ${formatZodError(result.error)}`,
    })
  }

  return result.data
}

export function validateParams<TSchema extends ZodTypeAny>(
  schema: TSchema
): MiddlewareHandler<ServerBindings> {
  return async (context, next) => {
    const params = parseValue(schema, context.req.param(), "params")
    context.set("validatedParams", params)
    await next()
  }
}

export function validateQuery<TSchema extends ZodTypeAny>(
  schema: TSchema
): MiddlewareHandler<ServerBindings> {
  return async (context, next) => {
    const query = parseValue(schema, context.req.query(), "query")
    context.set("validatedQuery", query)
    await next()
  }
}

export function validateJsonBody<TSchema extends ZodTypeAny>(
  schema: TSchema
): MiddlewareHandler<ServerBindings> {
  return async (context, next) => {
    const payload = await context.req.json().catch(() => {
      throw new HTTPException(400, {
        message: "Invalid body: malformed JSON",
      })
    })

    const body = parseValue(schema, payload, "body")
    context.set("validatedBody", body)
    await next()
  }
}
