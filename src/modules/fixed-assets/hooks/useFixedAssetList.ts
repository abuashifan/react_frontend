import { useQuery } from '@tanstack/react-query'
import { fixedAssetApi } from '../services/fixedAssetApi'
import type { FixedAssetListParams } from '../types/fixedAsset.types'

export function useFixedAssetList(params: FixedAssetListParams) {
  return useQuery({
    queryKey: ['fixed-assets', 'list', params],
    queryFn: () => fixedAssetApi.list(params),
  })
}

export function useFixedAsset(id?: number) {
  return useQuery({
    queryKey: ['fixed-assets', 'detail', id],
    queryFn: () => fixedAssetApi.get(id as number),
    enabled: Boolean(id),
  })
}
