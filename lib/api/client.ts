import axios, { AxiosHeaders } from 'axios'

import { getAccessToken } from './auth'
import { ApiError, normalizeAxiosError } from './error'
import type { ApiCode, ApiResponse } from './types'

const SUCCESS_CODES = new Set<ApiCode>([0, '0'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponseEnvelope(value: unknown): value is ApiResponse<unknown> {
  if (!isRecord(value)) return false
  return (
    typeof value.success === 'boolean' &&
    typeof value.code === 'number' &&
    typeof value.requestId === 'string'
  )
}

function isBusinessSuccess(payload: ApiResponse<unknown>): boolean {
  return payload.success === true && SUCCESS_CODES.has(payload.code)
}

function toBusinessError(payload: ApiResponse<unknown>, status?: number): ApiError {
  return new ApiError({
    code: payload.code ?? 'BUSINESS_ERROR',
    message: typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : 'Request failed',
    status,
    details: payload,
  })
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // Send cookies for auth
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (!token) return config

    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
    return config
  },
  (error) => Promise.reject(normalizeAxiosError(error))
)

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (isApiResponseEnvelope(payload) && !isBusinessSuccess(payload)) {
      throw toBusinessError(payload, response.status)
    }

    return response
  },
  (error) => Promise.reject(normalizeAxiosError(error))
)
