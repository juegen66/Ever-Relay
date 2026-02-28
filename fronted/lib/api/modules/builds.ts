import { request } from "@/lib/api"
import type {
  CreateBuildParams,
  CreateBuildResponseData,
  WorkflowRun,
} from "@/shared/contracts/builds"

export type {
  CreateBuildParams,
  CreateBuildResponseData,
  WorkflowRun,
}

export const buildsApi = {
  triggerBuild(params: CreateBuildParams) {
    return request.post<CreateBuildResponseData, CreateBuildParams>("/builds", params)
  },

  getBuildStatus(runId: string) {
    return request.get<WorkflowRun>(`/builds/${runId}`)
  },
}

