import type { Context } from "hono"

import type {
  CreateFileParams,
  FileIdParams,
  UpdateFileContentBody,
  UpdateFileParams,
} from "@/shared/contracts/files"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { filesService } from "./files.service"

/**
 * GET /api/files - List all desktop items for current user
 */
export async function listItems(context: Context<ServerBindings>) {
  const userId = requireUserId(context)
  const items = await filesService.getItemsByUserId(userId)
  return ok(context, items)
}

/**
 * POST /api/files - Create a new file or folder
 */
export async function createItem(
  context: Context<ServerBindings>,
  body: CreateFileParams
) {
  const userId = requireUserId(context)

  const item = await filesService.createItem({
    userId,
    name: body.name,
    itemType: body.itemType,
    parentId: body.parentId ?? null,
    x: body.x,
    y: body.y,
    content: body.content ?? null,
    fileSize: body.fileSize ?? null,
    mimeType: body.mimeType ?? null,
  })

  return ok(context, item)
}

/**
 * PATCH /api/files/:id - Update an item (rename, move position, move into folder)
 */
export async function updateItem(
  context: Context<ServerBindings>,
  params: FileIdParams,
  body: UpdateFileParams
) {
  const userId = requireUserId(context)

  const updated = await filesService.updateItem(params.id, userId, body)
  if (!updated) {
    return fail(context, 404, "Item not found")
  }

  return ok(context, updated)
}

/**
 * GET /api/files/:id/content - Get file content from database
 */
export async function getFileContent(
  context: Context<ServerBindings>,
  params: FileIdParams
) {
  const userId = requireUserId(context)

  const content = await filesService.getFileContent(params.id, userId)
  if (content === null) {
    return fail(context, 404, "File not found or has no content")
  }

  return ok(context, { content })
}

/**
 * PUT /api/files/:id/content - Update file content in database
 */
export async function updateFileContent(
  context: Context<ServerBindings>,
  params: FileIdParams,
  body: UpdateFileContentBody
) {
  const userId = requireUserId(context)

  const updated = await filesService.updateFileContent(params.id, userId, body.content)
  if (!updated) {
    return fail(context, 404, "File not found")
  }

  return ok(context, { updated: true as const })
}

/**
 * DELETE /api/files/:id - Delete an item (and its S3 file if exists)
 */
export async function deleteItem(
  context: Context<ServerBindings>,
  params: FileIdParams
) {
  const userId = requireUserId(context)

  const deleted = await filesService.deleteItem(params.id, userId)
  if (!deleted) {
    return fail(context, 404, "Item not found")
  }

  return ok(context, { deleted: true as const })
}
