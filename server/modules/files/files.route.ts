import type { Hono } from "hono"

import type {
  CreateFileParams,
  FileIdParams,
  UpdateFileContentBody,
  UpdateFileParams,
} from "@/shared/contracts/files"
import { filesContracts } from "@/shared/contracts/files"
import { getValidatedBody, getValidatedParams } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateParams } from "@/server/middlewares/validation"
import { listItems, createItem, updateItem, deleteItem, getFileContent, updateFileContent } from "./files.controller"
import type { ServerBindings } from "@/server/types"

export function registerFilesRoutes(app: Hono<ServerBindings>) {
  app.get("/api/files", authMiddleware, listItems)
  app.post(
    "/api/files",
    authMiddleware,
    validateJsonBody(filesContracts.createItem.bodySchema),
    (context) => createItem(context, getValidatedBody<CreateFileParams>(context))
  )
  app.get(
    "/api/files/:id/content",
    authMiddleware,
    validateParams(filesContracts.getFileContent.paramsSchema),
    (context) => getFileContent(context, getValidatedParams<FileIdParams>(context))
  )
  app.put(
    "/api/files/:id/content",
    authMiddleware,
    validateParams(filesContracts.updateFileContent.paramsSchema),
    validateJsonBody(filesContracts.updateFileContent.bodySchema),
    (context) =>
      updateFileContent(
        context,
        getValidatedParams<FileIdParams>(context),
        getValidatedBody<UpdateFileContentBody>(context)
      )
  )
  app.patch(
    "/api/files/:id",
    authMiddleware,
    validateParams(filesContracts.updateItem.paramsSchema),
    validateJsonBody(filesContracts.updateItem.bodySchema),
    (context) =>
      updateItem(
        context,
        getValidatedParams<FileIdParams>(context),
        getValidatedBody<UpdateFileParams>(context)
      )
  )
  app.delete(
    "/api/files/:id",
    authMiddleware,
    validateParams(filesContracts.deleteItem.paramsSchema),
    (context) => deleteItem(context, getValidatedParams<FileIdParams>(context))
  )
}
