import type { ApiResponse as SharedApiResponse } from "@/shared/contracts/common"

export type ApiCode = number | string

export interface ApiResponse<T = unknown>
  extends Pick<SharedApiResponse<T>, "success" | "requestId"> {
  code: number
  message?: string
  data?: T
}

