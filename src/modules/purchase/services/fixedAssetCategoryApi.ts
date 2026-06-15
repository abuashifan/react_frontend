import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'

interface FixedAssetCategory {
  id: number
  code: string
  name: string
  is_active: boolean
}

export const fixedAssetCategoryApi = {
  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, ApiResponse<FixedAssetCategory[]>>(
      '/fixed-assets/categories',
      { params: { search: query, is_active: true } },
    )
    const list = Array.isArray(res.data) ? res.data : []
    return list
      .filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase()))
      .map((c) => ({ value: c.id, label: c.name, sublabel: c.code }))
  },
}
