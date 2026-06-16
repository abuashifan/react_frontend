import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fixedAssetApi } from '../services/fixedAssetApi'
import type {
  CapitalizeFixedAssetPayload,
  CreateFixedAssetPayload,
  DisposeFixedAssetPayload,
  UpdateFixedAssetPayload,
} from '../types/fixedAsset.types'

export function useFixedAssetMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fixed-assets'] })

  return {
    create: useMutation({
      mutationFn: (payload: CreateFixedAssetPayload) => fixedAssetApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: UpdateFixedAssetPayload }) =>
        fixedAssetApi.update(id, payload),
      onSuccess: invalidate,
    }),
    capitalize: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: CapitalizeFixedAssetPayload }) =>
        fixedAssetApi.capitalize(id, payload),
      onSuccess: invalidate,
    }),
    dispose: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: DisposeFixedAssetPayload }) =>
        fixedAssetApi.dispose(id, payload),
      onSuccess: invalidate,
    }),
  }
}
