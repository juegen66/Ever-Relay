import { request } from "@/lib/api"
import type {
  ThirdPartyMcpBinding,
  UpsertThirdPartyMcpBindingBody,
} from "@/shared/contracts/third-party-mcp"

export type { ThirdPartyMcpBinding, UpsertThirdPartyMcpBindingBody }

export const thirdPartyMcpApi = {
  getBinding(appSlug: string) {
    return request.get<{ binding: ThirdPartyMcpBinding | null }>(
      `/third-party-mcp/bindings/${encodeURIComponent(appSlug)}`
    )
  },
  upsertBinding(appSlug: string, body: UpsertThirdPartyMcpBindingBody) {
    return request.put<ThirdPartyMcpBinding, UpsertThirdPartyMcpBindingBody>(
      `/third-party-mcp/bindings/${encodeURIComponent(appSlug)}`,
      body
    )
  },
  deleteBinding(appSlug: string) {
    return request.delete<{ deleted: true }>(
      `/third-party-mcp/bindings/${encodeURIComponent(appSlug)}`
    )
  },
}
