import { request } from "@/lib/api"
import type {
  CodingRun,
  CreateCodingRunParams,
  CreateCodingRunResponseData,
} from "@/shared/contracts/coding-runs"

export type {
  CodingRun,
  CreateCodingRunParams,
  CreateCodingRunResponseData,
}

export const codingRunsApi = {
  triggerRun(params: CreateCodingRunParams) {
    return request.post<CreateCodingRunResponseData, CreateCodingRunParams>(
      "/coding-runs",
      params
    )
  },

  getRun(runId: string) {
    return request.get<CodingRun>(`/coding-runs/${runId}`)
  },
}
