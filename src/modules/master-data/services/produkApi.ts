import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Produk, ProdukListParams, CreateProdukPayload, UpdateProdukPayload } from '../types/produk.types'

export const produkApi = {
  list: (params: ProdukListParams) =>
    http.get<unknown, PaginatedResponse<Produk>>('/master-data/products', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<Produk>>(`/master-data/products/${id}`),

  create: (payload: CreateProdukPayload) =>
    http.post<unknown, ApiResponse<Produk>>('/master-data/products', payload),

  update: (id: number, payload: UpdateProdukPayload) =>
    http.patch<unknown, ApiResponse<Produk>>(`/master-data/products/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/products/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/products/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<Produk>>(
      '/master-data/products',
      { params: { search: query, per_page: 10, is_active: true } },
    )
    return res.data.map((p) => ({
      value: p.id,
      label: p.product_name,
      sublabel: p.product_code ?? undefined,
    }))
  },
}
