import { HTTPException } from "hono/http-exception"
import type { Context } from "hono"
import { z, type ZodTypeAny } from "zod"

import type { ServerBindings } from "@/server/types"

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
  source: "params" | "query" | "body"
): z.infer<TSchema> {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new HTTPException(400, {
      message: `Invalid ${source}: ${formatZodError(result.error)}`,
    })
  }

  return result.data
}

export function parseParams<TSchema extends ZodTypeAny>(
  context: Context<ServerBindings>,
  schema: TSchema
) {
  return parseValue(schema, context.req.param(), "params")
}

export function parseQuery<TSchema extends ZodTypeAny>(
  context: Context<ServerBindings>,
  schema: TSchema
) {
  return parseValue(schema, context.req.query(), "query")
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  context: Context<ServerBindings>,
  schema: TSchema
) {
  const payload = await context.req.json().catch(() => {
    throw new HTTPException(400, {
      message: "Invalid body: malformed JSON",
    })
  })

  return parseValue(schema, payload, "body")
}
