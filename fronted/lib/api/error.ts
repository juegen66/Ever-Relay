import { AxiosError } from 'axios'

import type { ApiCode } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toApiCode(code: unknown, fallback: ApiCode): ApiCode {
  if (typeof code === 'number' || typeof code === 'string') return code
  return fallback
}

function toMessage(message: unknown, fallback: string): string {
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

export class ApiError extends Error {
  code: ApiCode
  status?: number
  details?: unknown

  constructor({
    code,
    message,
    status,
    details,
  }: {
    code: ApiCode
    message: string
    status?: number
    details?: unknown
  }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function normalizeAxiosError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const status = error.response?.status
    const payload = error.response?.data
    const fallbackMessage = error.message || 'Request failed'

    if (isRecord(payload)) {
      return new ApiError({
        code: toApiCode(payload.code, status ?? 'HTTP_ERROR'),
        message: toMessage(payload.message, fallbackMessage),
        status,
        details: payload,
      })
    }

    return new ApiError({
      code: status ?? 'NETWORK_ERROR',
      message: fallbackMessage,
      status,
      details: payload,
    })
  }

  if (error instanceof Error) {
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error,
    })
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected request error',
    details: error,
  })
}
