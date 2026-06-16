import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Coa, CoaListParams, CreateCoaPayload, UpdateCoaPayload } from '../types/coa.types'

export const coaApi = {
  list: (params: CoaListParams) =>
    http.get<unknown, PaginatedResponse<Coa>>('/master-data/chart-of-accounts', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<Coa>>(`/master-data/chart-of-accounts/${id}`),

  create: (payload: CreateCoaPayload) =>
    http.post<unknown, ApiResponse<Coa>>('/master-data/chart-of-accounts', payload),

  update: (id: number, payload: UpdateCoaPayload) =>
    http.patch<unknown, ApiResponse<Coa>>(`/master-data/chart-of-accounts/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/chart-of-accounts/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/chart-of-accounts/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Coa>>(
      '/master-data/chart-of-accounts',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((a) => ({
      value: a.id,
      label: a.account_name,
      sublabel: a.account_code,
    }))
  },
}
