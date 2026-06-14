import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { LoginPayload, LoginResponse, PermissionsResponse, User } from '@/types/auth.types'

export const authApi = {
  login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    return http.post<unknown, ApiResponse<LoginResponse>>('/auth/login', payload)
  },

  logout(): Promise<ApiResponse<null>> {
    return http.post<unknown, ApiResponse<null>>('/auth/logout')
  },

  me(): Promise<ApiResponse<{ user: User }>> {
    return http.get<unknown, ApiResponse<{ user: User }>>('/auth/me')
  },

  permissions(): Promise<ApiResponse<PermissionsResponse>> {
    return http.get<unknown, ApiResponse<PermissionsResponse>>('/auth/permissions')
  },
}
