import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { KategoriProduk, CreateKategoriProdukPayload, UpdateKategoriProdukPayload } from '../types/kategoriProduk.types'

export const kategoriProdukApi = {
  list: (params?: { search?: string }) =>
    http.get<unknown, PaginatedResponse<KategoriProduk>>('/master-data/product-categories', { params }),

  create: (payload: CreateKategoriProdukPayload) =>
    http.post<unknown, ApiResponse<KategoriProduk>>('/master-data/product-categories', payload),

  update: (id: number, payload: UpdateKategoriProdukPayload) =>
    http.patch<unknown, ApiResponse<KategoriProduk>>(`/master-data/product-categories/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/product-categories/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/product-categories/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<KategoriProduk>>(
      '/master-data/product-categories',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((k) => ({ value: k.id, label: k.name }))
  },
}
