import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import type { ApiError } from '@/types/api.types'

type ValidationErrorMap = Record<string, string>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (!Array.isArray(value)) return null

  const first = value.find((item): item is string => typeof item === 'string' && item.trim() !== '')
  return first ?? null
}

function responseDataFrom(error: unknown): Record<string, unknown> | null {
  if (!isRecord(error)) return null
  const response = error.response
  if (!isRecord(response)) return null
  return isRecord(response.data) ? response.data : null
}

function apiErrorFrom(error: unknown): Partial<ApiError> | null {
  const responseData = responseDataFrom(error)
  if (responseData) return responseData as Partial<ApiError>

  if (isRecord(error) && typeof error.message === 'string') {
    return error as Partial<ApiError>
  }

  return null
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  const apiError = apiErrorFrom(error)
  if (typeof apiError?.message === 'string' && apiError.message.trim() !== '') {
    return apiError.message
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return fallback
}

export function getApiValidationErrors(error: unknown): ValidationErrorMap {
  const apiError = apiErrorFrom(error)
  if (!isRecord(apiError?.errors)) return {}

  return Object.fromEntries(
    Object.entries(apiError.errors)
      .map(([field, messages]) => [field, firstMessage(messages)])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

export function isApiNotFound(error: unknown): boolean {
  const status = isRecord(error) && typeof error.status === 'number'
    ? error.status
    : isRecord(error) && isRecord(error.response) && typeof error.response.status === 'number'
      ? error.response.status
      : undefined

  return status === 404
}

export function applyApiValidationErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldMap: Partial<Record<string, FieldPath<TFieldValues>>> = {},
): boolean {
  const errors = getApiValidationErrors(error)
  let applied = false

  Object.entries(errors).forEach(([backendField, message]) => {
    const field = fieldMap[backendField] ?? (backendField as FieldPath<TFieldValues>)
    setError(field, { type: 'server', message })
    applied = true
  })

  return applied
}
