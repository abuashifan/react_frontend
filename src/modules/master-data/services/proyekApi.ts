import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Proyek, CreateProyekPayload, UpdateProyekPayload } from '../types/proyek.types'

export const proyekApi = {
  list: (params?: { search?: string; status?: string }) =>
    http.get<unknown, PaginatedResponse<Proyek>>('/master-data/projects', { params }),

  create: (payload: CreateProyekPayload) =>
    http.post<unknown, ApiResponse<Proyek>>('/master-data/projects', payload),

  update: (id: number, payload: UpdateProyekPayload) =>
    http.patch<unknown, ApiResponse<Proyek>>(`/master-data/projects/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/projects/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/projects/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Proyek>>(
      '/master-data/projects',
      { params: { search: query, per_page: 10, status: 'active' } },
    )
    return res.data.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: p.code,
    }))
  },
}
