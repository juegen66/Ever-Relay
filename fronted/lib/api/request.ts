import type { AxiosRequestConfig, AxiosResponse, Method } from 'axios'

import { apiClient } from './client'
import { normalizeAxiosError } from './error'
import type { ApiResponse } from './types'

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

function unwrapPayload<T>(payload: unknown): T {
  if (isApiResponseEnvelope(payload) && 'data' in payload) {
    return payload.data as T
  }
  return payload as T
}

async function execute<T, D = unknown>(
  method: Method,
  url: string,
  config?: AxiosRequestConfig<D>,
  data?: D
): Promise<T> {
  try {
    const response = await apiClient.request<unknown, AxiosResponse<unknown>, D>({
      ...config,
      method,
      url,
      data,
    })
    return unwrapPayload<T>(response.data)
  } catch (error) {
    throw normalizeAxiosError(error)
  }
}

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return execute<T>('GET', url, config)
  },
  post<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig<B>): Promise<T> {
    return execute<T, B>('POST', url, config, body)
  },
  put<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig<B>): Promise<T> {
    return execute<T, B>('PUT', url, config, body)
  },
  patch<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig<B>): Promise<T> {
    return execute<T, B>('PATCH', url, config, body)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return execute<T>('DELETE', url, config)
  },
}
