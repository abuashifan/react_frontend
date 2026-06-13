import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { LoginPayload, LoginResponse, PermissionsResponse, User } from '@/types/auth.types'

export const authApi = {
  login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    return http.post('/auth/login', payload)
  },

  logout(): Promise<ApiResponse<null>> {
    return http.post('/auth/logout')
  },

  me(): Promise<ApiResponse<{ user: User }>> {
    return http.get('/auth/me')
  },

  permissions(): Promise<ApiResponse<PermissionsResponse>> {
    return http.get('/auth/permissions')
  },
}
