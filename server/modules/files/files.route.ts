import type { Hono } from "hono"

import { authMiddleware } from "@/server/middlewares/auth"
import { listItems, createItem, updateItem, deleteItem, getFileContent, updateFileContent } from "./files.controller"
import type { ServerBindings } from "@/server/types"

export function registerFilesRoutes(app: Hono<ServerBindings>) {
  app.get("/api/files", authMiddleware, listItems)
  app.post("/api/files", authMiddleware, createItem)
  app.get("/api/files/:id/content", authMiddleware, getFileContent)
  app.put("/api/files/:id/content", authMiddleware, updateFileContent)
  app.patch("/api/files/:id", authMiddleware, updateItem)
  app.delete("/api/files/:id", authMiddleware, deleteItem)
}
