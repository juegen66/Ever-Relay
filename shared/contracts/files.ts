import { z } from "zod"

import { apiSuccessSchema } from "./common"

const fileIdSchema = z.string().uuid()

export const fileItemTypeSchema = z.enum([
  "folder",
  "text",
  "image",
  "code",
  "spreadsheet",
  "generic",
])

export type FileItemType = z.infer<typeof fileItemTypeSchema>

export const fileItemSchema = z.object({
  id: fileIdSchema,
  userId: z.string(),
  name: z.string(),
  itemType: fileItemTypeSchema,
  parentId: fileIdSchema.nullable(),
  x: z.number(),
  y: z.number(),
  content: z.string().nullable(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type FileItem = z.infer<typeof fileItemSchema>

export const createFileParamsSchema = z.object({
  name: z.string().trim().min(1),
  itemType: fileItemTypeSchema,
  parentId: fileIdSchema.nullable().optional(),
  x: z.number(),
  y: z.number(),
  content: z.string().nullable().optional(),
  fileSize: z.number().int().nullable().optional(),
  mimeType: z.string().nullable().optional(),
})

export type CreateFileParams = z.infer<typeof createFileParamsSchema>

export const updateFileParamsSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    parentId: fileIdSchema.nullable().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.parentId !== undefined ||
      value.x !== undefined ||
      value.y !== undefined,
    {
      message: "At least one field is required",
    }
  )

export type UpdateFileParams = z.infer<typeof updateFileParamsSchema>

export const fileIdParamsSchema = z.object({
  id: fileIdSchema,
})

export type FileIdParams = z.infer<typeof fileIdParamsSchema>

export const fileContentResponseDataSchema = z.object({
  content: z.string(),
})

export type FileContentResponseData = z.infer<typeof fileContentResponseDataSchema>

export const updateFileContentBodySchema = z.object({
  content: z.string(),
})

export type UpdateFileContentBody = z.infer<typeof updateFileContentBodySchema>

export const updateFileContentResponseDataSchema = z.object({
  updated: z.literal(true),
})

export type UpdateFileContentResponseData = z.infer<typeof updateFileContentResponseDataSchema>

export const deleteFileItemResponseDataSchema = z.object({
  deleted: z.literal(true),
})

export type DeleteFileItemResponseData = z.infer<typeof deleteFileItemResponseDataSchema>

export const listFileItemsResponseSchema = apiSuccessSchema(z.array(fileItemSchema))
export const createFileItemResponseSchema = apiSuccessSchema(fileItemSchema)
export const updateFileItemResponseSchema = apiSuccessSchema(fileItemSchema)
export const getFileContentResponseSchema = apiSuccessSchema(fileContentResponseDataSchema)
export const updateFileContentResponseSchema = apiSuccessSchema(updateFileContentResponseDataSchema)
export const deleteFileItemResponseSchema = apiSuccessSchema(deleteFileItemResponseDataSchema)

export const filesContracts = {
  listItems: {
    responseSchema: listFileItemsResponseSchema,
  },
  createItem: {
    bodySchema: createFileParamsSchema,
    responseSchema: createFileItemResponseSchema,
  },
  updateItem: {
    paramsSchema: fileIdParamsSchema,
    bodySchema: updateFileParamsSchema,
    responseSchema: updateFileItemResponseSchema,
  },
  getFileContent: {
    paramsSchema: fileIdParamsSchema,
    responseSchema: getFileContentResponseSchema,
  },
  updateFileContent: {
    paramsSchema: fileIdParamsSchema,
    bodySchema: updateFileContentBodySchema,
    responseSchema: updateFileContentResponseSchema,
  },
  deleteItem: {
    paramsSchema: fileIdParamsSchema,
    responseSchema: deleteFileItemResponseSchema,
  },
} as const
