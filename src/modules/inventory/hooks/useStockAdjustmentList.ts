import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockAdjustmentApi } from '../services/stockAdjustmentApi'
import type { StockAdjustmentListParams, CreateStockAdjustmentPayload, UpdateStockAdjustmentPayload } from '../types/stockAdjustment.types'

const QK = {
  list: (p: StockAdjustmentListParams) => ['inventory', 'stock-adjustments', p] as const,
  detail: (id: number) => ['inventory', 'stock-adjustments', id] as const,
}

export function useStockAdjustmentList(params: StockAdjustmentListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => stockAdjustmentApi.list(params) })
}

export function useStockAdjustment(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => stockAdjustmentApi.get(id!),
    enabled: !!id,
  })
}

export function useStockAdjustmentMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['inventory', 'stock-adjustments'] })

  return {
    create: useMutation({ mutationFn: (p: CreateStockAdjustmentPayload) => stockAdjustmentApi.create(p), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateStockAdjustmentPayload }) => stockAdjustmentApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => stockAdjustmentApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => stockAdjustmentApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => stockAdjustmentApi.void(id, reason), onSuccess: invalidate }),
  }
}
