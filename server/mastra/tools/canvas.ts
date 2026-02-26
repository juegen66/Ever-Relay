import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { canvasService } from "@/server/modules/canvas/canvas.service"
import { requestContextSchema } from "./common"

/** Shape of a canvas project as returned by the service (includes schema fields). */
type CanvasProjectListItem = {
  id: string
  title: string
  status: string
  visibility: string
  updatedAt: Date
}

export const listCanvasProjectsTool = createTool({
  id: "list_canvas_projects",
  description: "List the current user's canvas projects.",
  inputSchema: z.object({
    q: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  requestContextSchema,
  execute: async ({ q, limit }, context) => {
    console.log("🔍 Step 1: Extracting userId from context...");
    const userId = context.requestContext?.get("userId") as string | undefined

    if (!userId) {
      console.log("❌ Step 2: Failed to get userId, user not authenticated.");
      return {
        ok: false,
        error: "Missing authenticated user context",
      }
    }

    console.log(`🗃️ Step 3: Fetching canvas projects for user: ${userId}...`);
    const result = await canvasService.listProjects(userId, {
      q,
      limit: limit ?? 20,
      includeDeleted: false,
      sort: "updated",
      order: "desc",
    })

    console.log(`✅ Step 4: Fetched ${result.items.length} projects, preparing response...`);

    return {
      ok: true,
      total: result.items.length,
      nextCursor: result.nextCursor,
      items: (result.items as unknown as CanvasProjectListItem[]).map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        visibility: project.visibility,
        updatedAt: project.updatedAt,
      })),
    }
  },
})