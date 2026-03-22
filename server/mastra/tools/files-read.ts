import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import { filesService } from "@/server/modules/files/files.service"

import { requestContextSchema } from "./common"

export const readDesktopFileTool = createTool({
  id: "read_desktop_file_backend",
  description:
    "Read a desktop file by id, including its latest content and content version.",
  requestContextSchema,
  inputSchema: z.object({
    fileId: z.string().uuid(),
  }),
  execute: async ({ fileId }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    const item = await filesService.getItemById(fileId, userId)
    if (!item) {
      return { ok: false, error: "File not found" }
    }

    return {
      ok: true,
      file: {
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        parentId: item.parentId,
        content: item.content ?? "",
        contentVersion: item.contentVersion,
        updatedAt: item.updatedAt.toISOString(),
        mimeType: item.mimeType,
      },
    }
  },
})
