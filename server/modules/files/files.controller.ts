import type { Context } from "hono"

import { filesService } from "./files.service"
import type { ServerBindings } from "@/server/types"

function badRequest(context: Context<ServerBindings>, message: string) {
  const requestId = context.get("requestId")
  return context.json(
    { success: false, code: 400, message, requestId },
    400
  )
}

function unauthorized(context: Context<ServerBindings>) {
  const requestId = context.get("requestId")
  return context.json(
    { success: false, code: 401, message: "Unauthorized", requestId },
    401
  )
}

function notFound(context: Context<ServerBindings>, message = "Not found") {
  const requestId = context.get("requestId")
  return context.json(
    { success: false, code: 404, message, requestId },
    404
  )
}

/**
 * GET /api/files - List all desktop items for current user
 */
export async function listItems(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const items = await filesService.getItemsByUserId(user.id)

  return context.json({
    success: true,
    code: 0,
    data: items,
  })
}

/**
 * POST /api/files - Create a new file or folder
 */
export async function createItem(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const payload = await context.req.json().catch(() => null)
  if (!payload) return badRequest(context, "Invalid JSON body")

  const { name, itemType, parentId, x, y, content, fileSize, mimeType } = payload

  if (typeof name !== "string" || !name.trim()) {
    return badRequest(context, "name is required")
  }

  const validTypes = ["folder", "text", "image", "code", "spreadsheet", "generic"]
  if (!validTypes.includes(itemType)) {
    return badRequest(context, `itemType must be one of: ${validTypes.join(", ")}`)
  }

  if (typeof x !== "number" || typeof y !== "number") {
    return badRequest(context, "x and y coordinates are required")
  }

  const item = await filesService.createItem({
    userId: user.id,
    name: name.trim(),
    itemType,
    parentId: parentId ?? null,
    x,
    y,
    content: content ?? null,
    fileSize: fileSize ?? null,
    mimeType: mimeType ?? null,
  })

  return context.json({
    success: true,
    code: 0,
    data: item,
  })
}

/**
 * PATCH /api/files/:id - Update an item (rename, move position, move into folder)
 */
export async function updateItem(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const id = context.req.param("id")
  if (!id) return badRequest(context, "id is required")

  const payload = await context.req.json().catch(() => null)
  if (!payload) return badRequest(context, "Invalid JSON body")

  const { name, parentId, x, y } = payload
  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return badRequest(context, "name must be a non-empty string")
    }
    updateData.name = name.trim()
  }

  if (parentId !== undefined) {
    updateData.parentId = parentId
  }

  if (x !== undefined) {
    if (typeof x !== "number") {
      return badRequest(context, "x must be a number")
    }
    updateData.x = x
  }

  if (y !== undefined) {
    if (typeof y !== "number") {
      return badRequest(context, "y must be a number")
    }
    updateData.y = y
  }

  if (Object.keys(updateData).length === 0) {
    return badRequest(context, "No valid fields to update")
  }

  const updated = await filesService.updateItem(id, user.id, updateData)

  if (!updated) {
    return notFound(context, "Item not found")
  }

  return context.json({
    success: true,
    code: 0,
    data: updated,
  })
}

/**
 * GET /api/files/:id/content - Get file content from database
 */
export async function getFileContent(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const id = context.req.param("id")
  if (!id) return badRequest(context, "id is required")

  const content = await filesService.getFileContent(id, user.id)

  if (content === null) {
    return notFound(context, "File not found or has no content")
  }

  return context.json({
    success: true,
    code: 0,
    data: { content },
  })
}

/**
 * PUT /api/files/:id/content - Update file content in database
 */
export async function updateFileContent(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const id = context.req.param("id")
  if (!id) return badRequest(context, "id is required")

  const payload = await context.req.json().catch(() => null)
  if (!payload) return badRequest(context, "Invalid JSON body")

  const { content } = payload
  if (typeof content !== "string") {
    return badRequest(context, "content must be a string")
  }

  const updated = await filesService.updateFileContent(id, user.id, content)

  if (!updated) {
    return notFound(context, "File not found")
  }

  return context.json({
    success: true,
    code: 0,
    data: { updated: true },
  })
}

/**
 * DELETE /api/files/:id - Delete an item (and its S3 file if exists)
 */
export async function deleteItem(context: Context<ServerBindings>) {
  const user = context.get("user")
  if (!user?.id) return unauthorized(context)

  const id = context.req.param("id")
  if (!id) return badRequest(context, "id is required")

  const deleted = await filesService.deleteItem(id, user.id)

  if (!deleted) {
    return notFound(context, "Item not found")
  }

  return context.json({
    success: true,
    code: 0,
    data: { deleted: true },
  })
}
