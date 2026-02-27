import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { canvasService } from "@/server/modules/canvas/canvas.service"
import { assertOperationApproved } from "@/server/mastra/tools/safety/approvals"
import { requestContextSchema } from "./common"

export const createCanvasProjectTool = createTool({
  id: "create_canvas_project_backend",
  description: "Create a canvas project for the authenticated user.",
  requestContextSchema,
  inputSchema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional(),
    canvasWidth: z.number().int().positive().optional(),
    canvasHeight: z.number().int().positive().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }),
  execute: async (input, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    try {
      const project = await canvasService.createProject({
        userId,
        title: input.title,
        description: input.description,
        canvasWidth: input.canvasWidth,
        canvasHeight: input.canvasHeight,
        tagIds: input.tagIds ?? [],
      })
      return {
        ok: true,
        project: {
          id: project.id,
          title: project.title,
          contentVersion: project.contentVersion,
          updatedAt: project.updatedAt,
        },
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create canvas project",
      }
    }
  },
})

export const updateCanvasProjectTool = createTool({
  id: "update_canvas_project_backend",
  description: "Update canvas metadata or content for the authenticated user.",
  requestContextSchema,
  inputSchema: z.object({
    projectId: z.string().uuid(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    visibility: z.enum(["private", "unlisted"]).optional(),
    thumbnailUrl: z.string().nullable().optional(),
    contentJson: z.record(z.string(), z.unknown()).optional(),
    contentVersion: z.number().int().min(1).optional(),
    approved: z.boolean().optional(),
  }),
  execute: async (input, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    const requiresApproval = input.status === "published" || input.status === "archived"
    const approval = assertOperationApproved({
      approved: input.approved,
      destructive: requiresApproval,
      operation: "update_canvas_project_backend",
    })
    if (!approval.ok) {
      return approval
    }

    const { contentJson, contentVersion } = input
    if (contentJson !== undefined) {
      if (!contentVersion) {
        return { ok: false, error: "contentVersion is required when contentJson is provided" }
      }

      const contentUpdate = await canvasService.updateProjectContent(input.projectId, userId, {
        contentJson,
        contentVersion,
      })
      if (!contentUpdate.ok) {
        if (contentUpdate.reason === "version_conflict") {
          return {
            ok: false,
            error: "Project content version conflict",
            expectedVersion: contentUpdate.expectedVersion,
          }
        }
        return { ok: false, error: "Project not found" }
      }
    }

    const metadataUpdates = {
      title: input.title,
      description: input.description,
      status: input.status,
      visibility: input.visibility,
      thumbnailUrl: input.thumbnailUrl,
    }

    if (Object.values(metadataUpdates).every((value) => value === undefined)) {
      const project = await canvasService.getProjectById(input.projectId, userId, {
        includeDeleted: true,
      })

      if (!project) {
        return { ok: false, error: "Project not found" }
      }

      return {
        ok: true,
        project: {
          id: project.id,
          title: project.title,
          contentVersion: project.contentVersion,
          updatedAt: project.updatedAt,
        },
      }
    }

    const project = await canvasService.updateProject(input.projectId, userId, metadataUpdates)
    if (!project) {
      return { ok: false, error: "Project not found" }
    }

    return {
      ok: true,
      project: {
        id: project.id,
        title: project.title,
        contentVersion: project.contentVersion,
        updatedAt: project.updatedAt,
      },
    }
  },
})

