import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Kontak, KontakListParams, CreateKontakPayload, UpdateKontakPayload } from '../types/kontak.types'

export const kontakApi = {
  list: (params: KontakListParams) =>
    http.get<unknown, PaginatedResponse<Kontak>>('/master-data/contacts', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<Kontak>>(`/master-data/contacts/${id}`),

  create: (payload: CreateKontakPayload) =>
    http.post<unknown, ApiResponse<Kontak>>('/master-data/contacts', payload),

  update: (id: number, payload: UpdateKontakPayload) =>
    http.patch<unknown, ApiResponse<Kontak>>(`/master-data/contacts/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/contacts/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/contacts/${id}/deactivate`),

  search: async (query: string, type?: 'customer' | 'supplier'): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Kontak>>(
      '/master-data/contacts',
      {
        params: {
          search: query,
          per_page: 10,
          is_active: true,
          ...(type === 'customer' ? { is_customer: true } : {}),
          ...(type === 'supplier' ? { is_supplier: true } : {}),
        },
      },
    )
    return res.data.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: c.contact_code ?? undefined,
    }))
  },
}
