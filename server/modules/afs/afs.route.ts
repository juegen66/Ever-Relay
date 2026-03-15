import type { Hono } from "hono"

import { afsContracts } from "@/shared/contracts/afs"
import { getValidatedBody, getValidatedQuery } from "@/server/lib/http/validated"
import { authMiddleware } from "@/server/middlewares/auth"
import { validateJsonBody, validateQuery } from "@/server/middlewares/validation"
import type { ServerBindings } from "@/server/types"
import type {
  AfsDeleteBody,
  AfsListQuery,
  AfsReadQuery,
  AfsSearchQuery,
  AfsWriteBody,
  LogActionBatchBody,
  LogActionBody,
} from "@/shared/contracts/afs"

import {
  afsDelete,
  afsList,
  afsRead,
  afsSearch,
  afsWrite,
  logAction,
  logActionBatch,
} from "./afs.controller"

export function registerAfsRoutes(app: Hono<ServerBindings>) {
  app.get(
    "/api/afs/list",
    authMiddleware,
    validateQuery(afsContracts.list.querySchema),
    (context) => afsList(context, getValidatedQuery<AfsListQuery>(context))
  )

  app.get(
    "/api/afs/read",
    authMiddleware,
    validateQuery(afsContracts.read.querySchema),
    (context) => afsRead(context, getValidatedQuery<AfsReadQuery>(context))
  )

  app.post(
    "/api/afs/write",
    authMiddleware,
    validateJsonBody(afsContracts.write.bodySchema),
    (context) => afsWrite(context, getValidatedBody<AfsWriteBody>(context))
  )

  app.get(
    "/api/afs/search",
    authMiddleware,
    validateQuery(afsContracts.search.querySchema),
    (context) => afsSearch(context, getValidatedQuery<AfsSearchQuery>(context))
  )

  app.post(
    "/api/afs/delete",
    authMiddleware,
    validateJsonBody(afsContracts.delete.bodySchema),
    (context) => afsDelete(context, getValidatedBody<AfsDeleteBody>(context))
  )

  // Action log persistence endpoints
  app.post(
    "/api/afs/actions",
    authMiddleware,
    validateJsonBody(afsContracts.logAction.bodySchema),
    (context) => logAction(context, getValidatedBody<LogActionBody>(context))
  )

  app.post(
    "/api/afs/actions/batch",
    authMiddleware,
    validateJsonBody(afsContracts.logActionBatch.bodySchema),
    (context) => logActionBatch(context, getValidatedBody<LogActionBatchBody>(context))
  )
}
