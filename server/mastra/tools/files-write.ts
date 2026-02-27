import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { filesService } from "@/server/modules/files/files.service"
import { assertOperationApproved } from "@/server/mastra/tools/safety/approvals"
import { fileItemTypeSchema } from "@/shared/contracts/files"
import { requestContextSchema } from "./common"

export const createDesktopItemTool = createTool({
  id: "create_desktop_item_backend",
  description: "Create a desktop item for the authenticated user.",
  requestContextSchema,
  inputSchema: z.object({
    name: z.string().trim().min(1),
    itemType: fileItemTypeSchema.default("text"),
    parentId: z.string().uuid().nullable().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    content: z.string().nullable().optional(),
    mimeType: z.string().nullable().optional(),
  }),
  execute: async (input, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    const item = await filesService.createItem({
      userId,
      name: input.name,
      itemType: input.itemType,
      parentId: input.parentId ?? null,
      x: input.x ?? 120,
      y: input.y ?? 120,
      content: input.content ?? null,
      fileSize: input.content ? new TextEncoder().encode(input.content).byteLength : null,
      mimeType: input.mimeType ?? null,
    })

    return {
      ok: true,
      item: {
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        parentId: item.parentId,
      },
    }
  },
})

export const updateFileContentTool = createTool({
  id: "update_file_content_backend",
  description: "Update full text content for an existing text file item.",
  requestContextSchema,
  inputSchema: z.object({
    fileId: z.string().uuid(),
    content: z.string(),
    contentVersion: z.number().int().min(1).optional(),
  }),
  execute: async ({ fileId, content, contentVersion }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    let nextVersion = contentVersion
    if (!nextVersion) {
      const latest = await filesService.getFileContent(fileId, userId)
      if (!latest) {
        return { ok: false, error: "File not found" }
      }
      nextVersion = latest.contentVersion
    }

    const result = await filesService.updateFileContent(fileId, userId, {
      content,
      contentVersion: nextVersion,
    })

    if (!result.ok) {
      if (result.reason === "version_conflict") {
        return {
          ok: false,
          error: "Version conflict",
          expectedVersion: result.expectedVersion,
        }
      }
      return { ok: false, error: "File not found" }
    }

    return {
      ok: true,
      contentVersion: result.contentVersion,
    }
  },
})

export const deleteDesktopItemTool = createTool({
  id: "delete_desktop_item_backend",
  description: "Delete a desktop item. This is a destructive operation.",
  requestContextSchema,
  inputSchema: z.object({
    id: z.string().uuid(),
    approved: z.boolean().optional(),
  }),
  execute: async ({ id, approved }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    const approval = assertOperationApproved({
      approved,
      destructive: true,
      operation: "delete_desktop_item_backend",
    })
    if (!approval.ok) {
      return approval
    }

    const deleted = await filesService.deleteItem(id, userId)
    if (!deleted) {
      return { ok: false, error: "Item not found" }
    }

    return { ok: true, deleted: true as const }
  },
})

