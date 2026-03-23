import { request } from "@/lib/api"
import type {
  CreateThirdPartyAppBody,
  ThirdPartyAppConfig,
  UpdateThirdPartyAppBody,
} from "@/shared/contracts/third-party-apps"

export type {
  CreateThirdPartyAppBody,
  ThirdPartyAppConfig,
  UpdateThirdPartyAppBody,
}

export const thirdPartyAppsApi = {
  listApps() {
    return request.get<ThirdPartyAppConfig[]>("/third-party-apps")
  },

  createApp(body: CreateThirdPartyAppBody) {
    return request.post<ThirdPartyAppConfig, CreateThirdPartyAppBody>("/third-party-apps", body)
  },

  getApp(appSlug: string) {
    return request.get<ThirdPartyAppConfig>(`/third-party-apps/${encodeURIComponent(appSlug)}`)
  },

  updateApp(appSlug: string, body: UpdateThirdPartyAppBody) {
    return request.put<ThirdPartyAppConfig, UpdateThirdPartyAppBody>(
      `/third-party-apps/${encodeURIComponent(appSlug)}`,
      body
    )
  },

  deleteApp(appSlug: string) {
    return request.delete<{ deleted: true }>(`/third-party-apps/${encodeURIComponent(appSlug)}`)
  },
}
