import { request } from "@/lib/api"
import type {
  CodingApp,
  CreateCodingAppParams,
} from "@/shared/contracts/coding-apps"

export type {
  CodingApp,
  CreateCodingAppParams,
}

export const codingAppsApi = {
  listApps() {
    return request.get<CodingApp[]>("/coding-apps")
  },

  list() {
    return request.get<CodingApp[]>("/coding-apps")
  },

  createApp(params: CreateCodingAppParams) {
    return request.post<CodingApp, CreateCodingAppParams>("/coding-apps", params)
  },

  create(params: CreateCodingAppParams) {
    return request.post<CodingApp, CreateCodingAppParams>("/coding-apps", params)
  },

  getApp(id: string) {
    return request.get<CodingApp>(`/coding-apps/${id}`)
  },

  getById(id: string) {
    return request.get<CodingApp>(`/coding-apps/${id}`)
  },

  activateApp(id: string) {
    return request.post<CodingApp>(`/coding-apps/${id}/activate`)
  },

  activate(id: string) {
    return request.post<CodingApp>(`/coding-apps/${id}/activate`)
  },
}
