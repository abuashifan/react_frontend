import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fixedAssetCategoryApi } from '../services/fixedAssetCategoryApi'
import type {
  CreateFixedAssetCategoryPayload,
  UpdateFixedAssetCategoryPayload,
} from '../types/fixedAsset.types'

const QK = {
  root: ['fixed-assets', 'categories'] as const,
  list: (search: string) => ['fixed-assets', 'categories', 'list', search] as const,
}

export function useFixedAssetCategories(search = '') {
  return useQuery({
    queryKey: QK.list(search),
    queryFn: () => fixedAssetCategoryApi.list({ search }),
  })
}

export function useFixedAssetCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK.root })

  return {
    create: useMutation({
      mutationFn: (payload: CreateFixedAssetCategoryPayload) => fixedAssetCategoryApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: UpdateFixedAssetCategoryPayload }) =>
        fixedAssetCategoryApi.update(id, payload),
      onSuccess: invalidate,
    }),
  }
}
