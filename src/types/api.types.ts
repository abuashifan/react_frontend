export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiError {
  success: false
  code: string
  message: string
  status?: number
  errors?: Record<string, string[]>
  meta?: Record<string, unknown>
}

export interface ListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
}
