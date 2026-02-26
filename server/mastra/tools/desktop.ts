import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { filesService } from "@/server/modules/files/files.service"
import { requestContextSchema } from "./common"

export const listDesktopItemsTool = createTool({
  id: "list_desktop_items",
  description: "List the current user's desktop items (files and folders).",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).optional(),
    includeChildren: z.boolean().optional(),
  }),
  requestContextSchema,
  execute: async ({ limit, includeChildren }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return {
        ok: false,
        error: "Missing authenticated user context",
      }
    }

    const items = await filesService.getItemsByUserId(userId)
    const filtered = includeChildren ? items : items.filter((item) => !item.parentId)
    const sliced = filtered.slice(0, limit ?? 50)

    return {
      ok: true,
      total: filtered.length,
      items: sliced.map((item) => ({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        parentId: item.parentId,
        x: item.x,
        y: item.y,
        updatedAt: item.updatedAt,
      })),
    }
  },
})
