import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Departemen, CreateDepartemenPayload, UpdateDepartemenPayload } from '../types/departemen.types'

export const departemenApi = {
  list: (params?: { search?: string; is_active?: boolean }) =>
    http.get<unknown, PaginatedResponse<Departemen>>('/master-data/departments', { params }),

  create: (payload: CreateDepartemenPayload) =>
    http.post<unknown, ApiResponse<Departemen>>('/master-data/departments', payload),

  update: (id: number, payload: UpdateDepartemenPayload) =>
    http.patch<unknown, ApiResponse<Departemen>>(`/master-data/departments/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/departments/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/departments/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Departemen>>(
      '/master-data/departments',
      { params: { search: query, per_page: 10, is_active: true } },
    )
    return res.data.map((d) => ({
      value: d.id,
      label: d.name,
      sublabel: d.code,
    }))
  },
}
