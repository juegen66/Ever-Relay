import { request } from '@/lib/api'

// ---------------------------------------------------------------------------
// DTO Types
// ---------------------------------------------------------------------------

export interface FileItem {
  id: string
  userId: string
  name: string
  itemType: string
  parentId: string | null
  x: number
  y: number
  content: string | null
  fileSize: number | null
  mimeType: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateFileParams {
  name: string
  itemType: string
  x: number
  y: number
  parentId?: string | null
  content?: string | null
  fileSize?: number | null
  mimeType?: string | null
}

export interface UpdateFileParams {
  name?: string
  x?: number
  y?: number
  parentId?: string | null
}

// ---------------------------------------------------------------------------
// Files API Repository
// ---------------------------------------------------------------------------

export const filesApi = {
  list() {
    return request.get<FileItem[]>('/files')
  },

  create(params: CreateFileParams) {
    return request.post<FileItem, CreateFileParams>('/files', params)
  },

  update(id: string, params: UpdateFileParams) {
    return request.patch<FileItem, UpdateFileParams>(`/files/${id}`, params)
  },

  remove(id: string) {
    return request.delete<void>(`/files/${id}`)
  },

  getContent(id: string) {
    return request.get<{ content: string }>(`/files/${id}/content`)
  },

  updateContent(id: string, content: string) {
    return request.put<{ updated: boolean }>(`/files/${id}/content`, { content })
  },
}
