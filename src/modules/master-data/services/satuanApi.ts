import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Satuan, CreateSatuanPayload, UpdateSatuanPayload } from '../types/satuan.types'

export const satuanApi = {
  list: (params?: { search?: string }) =>
    http.get<unknown, PaginatedResponse<Satuan>>('/master-data/units', { params }),

  create: (payload: CreateSatuanPayload) =>
    http.post<unknown, ApiResponse<Satuan>>('/master-data/units', payload),

  update: (id: number, payload: UpdateSatuanPayload) =>
    http.patch<unknown, ApiResponse<Satuan>>(`/master-data/units/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/units/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/units/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Satuan>>(
      '/master-data/units',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((s) => ({
      value: s.id,
      label: s.name,
      sublabel: s.code,
    }))
  },
}
