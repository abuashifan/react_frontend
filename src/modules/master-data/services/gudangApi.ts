import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Gudang, CreateGudangPayload, UpdateGudangPayload } from '../types/gudang.types'

export const gudangApi = {
  list: (params?: { search?: string; is_active?: boolean }) =>
    http.get<unknown, PaginatedResponse<Gudang>>('/master-data/warehouses', { params }),

  create: (payload: CreateGudangPayload) =>
    http.post<unknown, ApiResponse<Gudang>>('/master-data/warehouses', payload),

  update: (id: number, payload: UpdateGudangPayload) =>
    http.patch<unknown, ApiResponse<Gudang>>(`/master-data/warehouses/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/warehouses/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/warehouses/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Gudang>>(
      '/master-data/warehouses',
      { params: { search: query, per_page: 10, is_active: true } },
    )
    return res.data.map((g) => ({ value: g.id, label: g.name }))
  },
}
