import { request } from "@/lib/api"
import type {
  CreateFileParams,
  DeleteFileItemResponseData,
  FileContentResponseData,
  FileItem,
  UpdateFileContentBody,
  UpdateFileContentResponseData,
  UpdateFileParams,
} from "@/shared/contracts/files"

export type {
  CreateFileParams,
  DeleteFileItemResponseData,
  FileContentResponseData,
  FileItem,
  UpdateFileContentBody,
  UpdateFileContentResponseData,
  UpdateFileParams,
}

export const filesApi = {
  list() {
    return request.get<FileItem[]>("/files")
  },

  create(params: CreateFileParams) {
    return request.post<FileItem, CreateFileParams>("/files", params)
  },

  update(id: string, params: UpdateFileParams) {
    return request.patch<FileItem, UpdateFileParams>(`/files/${id}`, params)
  },

  remove(id: string) {
    return request.delete<DeleteFileItemResponseData>(`/files/${id}`)
  },

  getContent(id: string) {
    return request.get<FileContentResponseData>(`/files/${id}/content`)
  },

  updateContent(id: string, content: string) {
    const body: UpdateFileContentBody = { content }
    return request.put<UpdateFileContentResponseData, UpdateFileContentBody>(
      `/files/${id}/content`,
      body
    )
  },
}

