import { adminHttp } from '@/services/adminHttp'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  AdminLoginResponse,
  AdminPlan,
  ClientUser,
  ClientUserListParams,
  CreateClientPayload,
  UpdateClientPayload,
} from '@/types/admin.types'

/** Bentuk mentah `listResponse()` backend sebelum diratakan jadi PaginatedResponse. */
interface BackendPage<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

function toPaginated<T>(page: BackendPage<T>): PaginatedResponse<T> {
  return {
    success: true,
    data: page.data,
    meta: {
      current_page: page.current_page,
      last_page: page.last_page,
      per_page: page.per_page,
      total: page.total,
    },
  }
}

export const adminApi = {
  async login(email: string, password: string): Promise<ApiResponse<AdminLoginResponse>> {
    return adminHttp.post<unknown, ApiResponse<AdminLoginResponse>>('/admin/login', {
      email,
      password,
    })
  },

  async logout(): Promise<void> {
    await adminHttp.post('/admin/logout')
  },

  async plans(): Promise<ApiResponse<AdminPlan[]>> {
    return adminHttp.get<unknown, ApiResponse<AdminPlan[]>>('/admin/plans')
  },

  async clients(params: ClientUserListParams): Promise<PaginatedResponse<ClientUser>> {
    const response = await adminHttp.get<unknown, ApiResponse<BackendPage<ClientUser>>>(
      '/admin/clients',
      { params },
    )

    return toPaginated(response.data)
  },

  async createClient(payload: CreateClientPayload): Promise<ApiResponse<ClientUser>> {
    return adminHttp.post<unknown, ApiResponse<ClientUser>>('/admin/clients', payload)
  },

  async updateClient(id: number, payload: UpdateClientPayload): Promise<ApiResponse<ClientUser>> {
    return adminHttp.patch<unknown, ApiResponse<ClientUser>>(`/admin/clients/${id}`, payload)
  },

  async updateClientPlan(id: number, planId: number | null): Promise<ApiResponse<ClientUser>> {
    return adminHttp.patch<unknown, ApiResponse<ClientUser>>(`/admin/clients/${id}/plan`, {
      plan_id: planId,
    })
  },

  async resetClientPassword(id: number, password: string): Promise<void> {
    await adminHttp.post(`/admin/clients/${id}/reset-password`, { password })
  },
}
