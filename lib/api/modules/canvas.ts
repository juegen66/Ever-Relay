import { request } from "@/lib/api"
import type {
  CanvasProject,
  CanvasProjectListParams,
  CanvasProjectListResult,
  CanvasProjectStatus,
  CanvasTag,
  CanvasVisibility,
  CreateCanvasProjectParams,
  CreateCanvasTagParams,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
} from "@/shared/contracts/canvas"

export type {
  CanvasProject,
  CanvasProjectListParams,
  CanvasProjectListResult,
  CanvasProjectStatus,
  CanvasTag,
  CanvasVisibility,
  CreateCanvasProjectParams,
  CreateCanvasTagParams,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
}

export const canvasApi = {
  listProjects(params?: CanvasProjectListParams) {
    return request.get<CanvasProjectListResult>("/canvas/projects", {
      params: {
        ...params,
        status: params?.status?.join(","),
      },
    })
  },

  getProject(id: string, includeDeleted = false) {
    return request.get<CanvasProject>(`/canvas/projects/${id}`, {
      params: { includeDeleted: includeDeleted ? "true" : undefined },
    })
  },

  createProject(params: CreateCanvasProjectParams) {
    return request.post<CanvasProject, CreateCanvasProjectParams>(
      "/canvas/projects",
      params
    )
  },

  updateProject(id: string, params: UpdateCanvasProjectParams) {
    return request.patch<CanvasProject, UpdateCanvasProjectParams>(
      `/canvas/projects/${id}`,
      params
    )
  },

  updateProjectContent(id: string, params: UpdateCanvasProjectContentParams) {
    return request.put<CanvasProject, UpdateCanvasProjectContentParams>(
      `/canvas/projects/${id}/content`,
      params
    )
  },

  duplicateProject(id: string) {
    return request.post<CanvasProject, Record<string, never>>(
      `/canvas/projects/${id}/duplicate`,
      {}
    )
  },

  deleteProject(id: string) {
    return request.delete<{ deleted: boolean }>(`/canvas/projects/${id}`)
  },

  restoreProject(id: string) {
    return request.post<CanvasProject, Record<string, never>>(
      `/canvas/projects/${id}/restore`,
      {}
    )
  },

  listTags() {
    return request.get<CanvasTag[]>("/canvas/tags")
  },

  createTag(name: string, color?: string) {
    const body: CreateCanvasTagParams = {
      name,
      color,
    }
    return request.post<CanvasTag, CreateCanvasTagParams>("/canvas/tags", body)
  },
}

