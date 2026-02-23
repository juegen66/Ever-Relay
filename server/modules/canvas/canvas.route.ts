import type { Hono } from "hono"

import type {
  CanvasProjectIdParams,
  CanvasProjectListParams,
  CreateCanvasProjectParams,
  CreateCanvasTagParams,
  GetCanvasProjectQuery,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
} from "@/shared/contracts/canvas"
import { canvasContracts } from "@/shared/contracts/canvas"
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import {
  validateJsonBody,
  validateParams,
  validateQuery,
} from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import {
  createProject,
  createTag,
  deleteProject,
  duplicateProject,
  getProjectById,
  listProjects,
  listTags,
  restoreProject,
  updateProject,
  updateProjectContent,
} from "./canvas.controller"

export function registerCanvasRoutes(app: Hono<ServerBindings>) {
  app.get(
    "/api/canvas/projects",
    authMiddleware,
    validateQuery(canvasContracts.listProjects.querySchema),
    (context) =>
      listProjects(context, getValidatedQuery<CanvasProjectListParams>(context))
  )
  app.post(
    "/api/canvas/projects",
    authMiddleware,
    validateJsonBody(canvasContracts.createProject.bodySchema),
    (context) => createProject(context, getValidatedBody<CreateCanvasProjectParams>(context))
  )
  app.get(
    "/api/canvas/projects/:id",
    authMiddleware,
    validateParams(canvasContracts.getProjectById.paramsSchema),
    validateQuery(canvasContracts.getProjectById.querySchema),
    (context) =>
      getProjectById(
        context,
        getValidatedParams<CanvasProjectIdParams>(context),
        getValidatedQuery<GetCanvasProjectQuery>(context)
      )
  )
  app.patch(
    "/api/canvas/projects/:id",
    authMiddleware,
    validateParams(canvasContracts.updateProject.paramsSchema),
    validateJsonBody(canvasContracts.updateProject.bodySchema),
    (context) =>
      updateProject(
        context,
        getValidatedParams<CanvasProjectIdParams>(context),
        getValidatedBody<UpdateCanvasProjectParams>(context)
      )
  )
  app.put(
    "/api/canvas/projects/:id/content",
    authMiddleware,
    validateParams(canvasContracts.updateProjectContent.paramsSchema),
    validateJsonBody(canvasContracts.updateProjectContent.bodySchema),
    (context) =>
      updateProjectContent(
        context,
        getValidatedParams<CanvasProjectIdParams>(context),
        getValidatedBody<UpdateCanvasProjectContentParams>(context)
      )
  )
  app.post(
    "/api/canvas/projects/:id/duplicate",
    authMiddleware,
    validateParams(canvasContracts.duplicateProject.paramsSchema),
    (context) =>
      duplicateProject(context, getValidatedParams<CanvasProjectIdParams>(context))
  )
  app.delete(
    "/api/canvas/projects/:id",
    authMiddleware,
    validateParams(canvasContracts.deleteProject.paramsSchema),
    (context) => deleteProject(context, getValidatedParams<CanvasProjectIdParams>(context))
  )
  app.post(
    "/api/canvas/projects/:id/restore",
    authMiddleware,
    validateParams(canvasContracts.restoreProject.paramsSchema),
    (context) =>
      restoreProject(context, getValidatedParams<CanvasProjectIdParams>(context))
  )

  app.get("/api/canvas/tags", authMiddleware, listTags)
  app.post(
    "/api/canvas/tags",
    authMiddleware,
    validateJsonBody(canvasContracts.createTag.bodySchema),
    (context) => createTag(context, getValidatedBody<CreateCanvasTagParams>(context))
  )
}
