import type { Context } from "hono"

import type {
  CanvasProjectIdParams,
  CanvasProjectListParams,
  CreateCanvasProjectParams,
  CreateCanvasTagParams,
  GetCanvasProjectQuery,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
} from "@/shared/contracts/canvas"
import { requireUserId } from "@/server/lib/http/auth"
import { fail, ok } from "@/server/lib/http/response"
import type { ServerBindings } from "@/server/types"
import { canvasService } from "./canvas.service"

export async function listProjects(
  context: Context<ServerBindings>,
  query: CanvasProjectListParams
) {
  const userId = requireUserId(context)

  const result = await canvasService.listProjects(userId, query)
  return ok(context, result)
}

export async function createProject(
  context: Context<ServerBindings>,
  body: CreateCanvasProjectParams
) {
  const userId = requireUserId(context)

  try {
    const project = await canvasService.createProject({
      userId,
      title: body.title,
      description: body.description,
      canvasWidth: body.canvasWidth,
      canvasHeight: body.canvasHeight,
      tagIds: body.tagIds ?? [],
    })

    return ok(context, project)
  } catch (error) {
    if (error instanceof Error && error.message === "One or more tags are invalid") {
      return fail(context, 400, error.message)
    }
    throw error
  }
}

export async function getProjectById(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams,
  query: GetCanvasProjectQuery
) {
  const userId = requireUserId(context)

  const project = await canvasService.getProjectById(params.id, userId, {
    includeDeleted: query.includeDeleted,
  })
  if (!project) {
    return fail(context, 404, "Project not found")
  }

  await canvasService.markProjectOpened(params.id, userId)
  return ok(context, project)
}

export async function updateProject(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams,
  body: UpdateCanvasProjectParams
) {
  const userId = requireUserId(context)

  try {
    const project = await canvasService.updateProject(params.id, userId, body)
    if (!project) {
      return fail(context, 404, "Project not found")
    }

    return ok(context, project)
  } catch (error) {
    if (error instanceof Error && error.message === "One or more tags are invalid") {
      return fail(context, 400, error.message)
    }
    throw error
  }
}

export async function updateProjectContent(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams,
  body: UpdateCanvasProjectContentParams
) {
  const userId = requireUserId(context)

  const result = await canvasService.updateProjectContent(params.id, userId, body)
  if (!result.ok) {
    if (result.reason === "not_found") {
      return fail(context, 404, "Project not found")
    }

    return fail(context, 409, "Project content version conflict", {
      expectedVersion: result.expectedVersion,
    })
  }

  return ok(context, result.project)
}

export async function duplicateProject(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams
) {
  const userId = requireUserId(context)

  const project = await canvasService.duplicateProject(params.id, userId)
  if (!project) {
    return fail(context, 404, "Project not found")
  }

  return ok(context, project)
}

export async function deleteProject(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams
) {
  const userId = requireUserId(context)

  const deleted = await canvasService.softDeleteProject(params.id, userId)
  if (!deleted) {
    return fail(context, 404, "Project not found")
  }

  return ok(context, { deleted: true as const })
}

export async function restoreProject(
  context: Context<ServerBindings>,
  params: CanvasProjectIdParams
) {
  const userId = requireUserId(context)

  const project = await canvasService.restoreProject(params.id, userId)
  if (!project) {
    return fail(context, 404, "Project not found")
  }

  return ok(context, project)
}

export async function listTags(context: Context<ServerBindings>) {
  const userId = requireUserId(context)
  const tags = await canvasService.listTags(userId)
  return ok(context, tags)
}

export async function createTag(
  context: Context<ServerBindings>,
  body: CreateCanvasTagParams
) {
  const userId = requireUserId(context)

  const tag = await canvasService.createTag(userId, body.name, body.color)
  return ok(context, tag)
}
