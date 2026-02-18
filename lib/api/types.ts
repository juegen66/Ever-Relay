export type ApiCode = number | string

export interface ApiResponse<T = unknown> {
  success?: boolean
  code?: ApiCode
  message?: string
  data?: T
}
