import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  CreateFixedAssetCategoryPayload,
  FixedAssetCategory,
  UpdateFixedAssetCategoryPayload,
} from '../types/fixedAsset.types'

export const fixedAssetCategoryApi = {
  list: (params?: { search?: string; is_active?: boolean }) =>
    http.get<unknown, ApiResponse<FixedAssetCategory[]>>('/fixed-assets/categories', { params }),

  create: (payload: CreateFixedAssetCategoryPayload) =>
    http.post<unknown, ApiResponse<FixedAssetCategory>>('/fixed-assets/categories', payload),

  update: (id: number, payload: UpdateFixedAssetCategoryPayload) =>
    http.patch<unknown, ApiResponse<FixedAssetCategory>>(`/fixed-assets/categories/${id}`, payload),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, ApiResponse<FixedAssetCategory[]>>(
      '/fixed-assets/categories',
      { params: { search: query, is_active: true } },
    )
    const needle = query.trim().toLowerCase()
    return (Array.isArray(res.data) ? res.data : [])
      .filter((category) => {
        if (!needle) return true
        return (
          category.name.toLowerCase().includes(needle) ||
          category.code.toLowerCase().includes(needle)
        )
      })
      .map((category) => ({
        value: category.id,
        label: category.name,
        sublabel: category.code,
      }))
  },
}
