import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  LoginPayload,
  LoginResponse,
  PermissionsResponse,
  SubscriptionSummary,
  User,
} from '@/types/auth.types'

export const authApi = {
  login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    return http.post<unknown, ApiResponse<LoginResponse>>('/auth/login', payload)
  },

  forgotPassword(email: string): Promise<ApiResponse<null>> {
    return http.post<unknown, ApiResponse<null>>('/auth/forgot-password', { email })
  },

  resetPassword(payload: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<ApiResponse<null>> {
    return http.post<unknown, ApiResponse<null>>('/auth/reset-password', payload)
  },

  logout(): Promise<ApiResponse<null>> {
    return http.post<unknown, ApiResponse<null>>('/auth/logout')
  },

  me(): Promise<ApiResponse<{ user: User; subscription: SubscriptionSummary | null }>> {
    return http.get<unknown, ApiResponse<{ user: User; subscription: SubscriptionSummary | null }>>('/auth/me')
  },

  permissions(): Promise<ApiResponse<PermissionsResponse>> {
    return http.get<unknown, ApiResponse<PermissionsResponse>>('/auth/permissions')
  },
}
